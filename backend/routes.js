const fs = require('fs');
const path = require('path');
const { validateTeam } = require('./fantasy-validation');

const dbFile = path.join(__dirname, 'data', 'batzo.json');

function readDB() {
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function writeDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function getUserId(req) {
  return String(req.user?.userId ?? req.user?.id ?? '');
}

function transactionTime(tx) {
  return new Date(tx.createdAt || tx.created_at || 0).getTime();
}

function getUserTransactions(db, userId) {
  if (!Array.isArray(db.transactions)) db.transactions = [];

  return db.transactions.filter(
    tx => String(tx.userId ?? tx.user_id) === String(userId)
  );
}

function calculateWallet(db, userId) {
  const transactions = getUserTransactions(db, userId);

  let balance = 0;
  let winning = 0;

  for (const tx of transactions) {
    const status = String(tx.status || '').toLowerCase();

    if (status !== 'success') continue;

    const type = String(tx.type || '').toLowerCase();
    const amount = Math.abs(Number(tx.amount || 0));

    if (type === 'deposit') {
      balance += amount;
    }

    if (type === 'entry_fee') {
      balance -= amount;
    }

    if (type === 'refund') {
      balance += amount;
    }

    if (type === 'winning') {
      winning += amount;
    }

    if (type === 'withdrawal') {
      winning -= amount;
    }
  }

  return {
    balance: money(Math.max(0, balance)),
    winning: money(Math.max(0, winning)),
    total: money(Math.max(0, balance) + Math.max(0, winning))
  };
}

function contestEntryFee(contest) {
  if (contest.entryFee !== undefined) {
    return Math.max(0, Number(contest.entryFee));
  }

  if (contest.entry_fee !== undefined) {
    return Math.max(0, Number(contest.entry_fee));
  }

  if (contest.entry_type === 'virtual') {
    return 0;
  }

  return 0;
}

function contestMaxSpots(contest) {
  return Number(
    contest.maxSpots ??
    contest.max_users ??
    contest.maxUsers ??
    0
  );
}

function contestJoinedCount(db, contestId) {
  if (!Array.isArray(db.contestEntries)) {
    db.contestEntries = [];
  }

  return db.contestEntries.filter(
    entry => Number(entry.contestId ?? entry.contest_id) === Number(contestId)
  ).length;
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function registerRoutes(app, authenticateToken) {

  // ============================================================
  // MATCHES
  // ============================================================

  app.get('/api/matches', (req, res) => {
    const db = readDB();

    res.json({
      success: true,
      matches: Array.isArray(db.matches) ? db.matches : []
    });
  });

  app.get('/api/matches/:id', (req, res) => {
    const db = readDB();

    const match = (db.matches || []).find(
      x => Number(x.id) === Number(req.params.id)
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const contests = (db.contests || []).map(contest => ({
      ...contest,
      joinedSpots: contestJoinedCount(db, contest.id),
      maxSpots: contestMaxSpots(contest)
    })).filter(
      contest => Number(contest.match_id ?? contest.matchId) === Number(match.id)
    );

    return res.json({
      success: true,
      match,
      contests
    });
  });


  // ============================================================
  // CONTESTS
  // ============================================================

  app.get('/api/contests', (req, res) => {
    const db = readDB();

    const contests = (db.contests || []).map(contest => ({
      ...contest,
      entryFee: contestEntryFee(contest),
      joinedSpots: contestJoinedCount(db, contest.id),
      maxSpots: contestMaxSpots(contest)
    }));

    return res.json({
      success: true,
      contests
    });
  });


  // ============================================================
  // CREATE TEAM
  // ============================================================

  app.post('/api/teams', authenticateToken, (req, res) => {
    try {
      const {
        match_id,
        team_name,
        players,
        captainId,
        viceCaptainId
      } = req.body || {};

      if (!match_id) {
        return res.status(400).json({
          success: false,
          message: 'match_id is required'
        });
      }

      if (!Array.isArray(players)) {
        return res.status(400).json({
          success: false,
          message: 'players array is required'
        });
      }

      const db = readDB();

      const match = (db.matches || []).find(
        x => Number(x.id) === Number(match_id)
      );

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found'
        });
      }

      const validation = validateTeam(
        players,
        captainId,
        viceCaptainId
      );

      if (!validation.ok) {
        return res.status(400).json({
          success: false,
          message: validation.error,
          validation
        });
      }

      if (!Array.isArray(db.teams)) {
        db.teams = [];
      }

      const userId = getUserId(req);

      const userTeams = db.teams.filter(
        x =>
          String(x.user_id) === userId &&
          Number(x.match_id) === Number(match_id)
      );

      if (userTeams.length >= 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 teams allowed for this match'
        });
      }

      const team = {
        id: Date.now(),
        user_id: req.user.userId,
        match_id: Number(match_id),
        team_name: String(
          team_name || ('Team ' + (userTeams.length + 1))
        ).trim(),
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          team: p.team,
          credits: Number(p.credits || 0)
        })),
        captainId,
        viceCaptainId,
        credits: validation.credits,
        roles: validation.roles,
        teams: validation.teams,
        created_at: new Date().toISOString()
      };

      db.teams.push(team);
      writeDB(db);

      return res.status(201).json({
        success: true,
        message: 'Team created successfully',
        team
      });

    } catch (error) {
      console.error('Create team failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create team'
      });
    }
  });


  app.get('/api/my-teams', authenticateToken, (req, res) => {
    const db = readDB();
    const userId = getUserId(req);

    const teams = (db.teams || []).filter(
      x => String(x.user_id) === userId
    );

    return res.json({
      success: true,
      teams
    });
  });


  // ============================================================
  // WALLET
  // ============================================================

  app.get('/api/wallet', authenticateToken, (req, res) => {
    try {
      const db = readDB();
      const userId = getUserId(req);

      const wallet = calculateWallet(db, userId);

      const transactions = getUserTransactions(db, userId)
        .slice()
        .sort((a, b) => transactionTime(b) - transactionTime(a));

      return res.json({
        success: true,
        balance: wallet.balance,
        winning: wallet.winning,
        total: wallet.total,
        transactions
      });

    } catch (error) {
      console.error('Wallet load failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to load wallet'
      });
    }
  });

  // ===== BATZO_DEMO_WALLET_ACTIONS_V1 =====

  app.post('/api/wallet/demo/deposit', authenticateToken, (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const amount = money(req.body?.amount);

      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Enter an amount between ₹1 and ₹100000'
        });
      }

      const db = readDB();

      if (!Array.isArray(db.transactions)) {
        db.transactions = [];
      }

      db.transactions.push({
        id: generateId('tx'),
        userId,
        type: 'deposit',
        amount,
        status: 'success',
        description: 'Add Money',
        createdAt: new Date().toISOString()
      });

      writeDB(db);

      const wallet = calculateWallet(db, userId);

      return res.json({
        success: true,
        message: `₹${amount.toFixed(2)} added successfully`,
        balance: wallet.balance,
        winningBalance: wallet.winning,
        totalBalance: wallet.total
      });
    } catch (error) {
      console.error('WALLET DEMO DEPOSIT:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to add money'
      });
    }
  });

  app.post('/api/wallet/demo/withdraw', authenticateToken, (req, res) => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const amount = money(req.body?.amount);

      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid withdrawal amount'
        });
      }

      const db = readDB();
      const walletBefore = calculateWallet(db, userId);

      if (amount > walletBefore.winning) {
        return res.status(400).json({
          success: false,
          message: `Insufficient winning balance. Available: ₹${walletBefore.winning.toFixed(2)}`
        });
      }

      if (!Array.isArray(db.transactions)) {
        db.transactions = [];
      }

      db.transactions.push({
        id: generateId('tx'),
        userId,
        type: 'withdrawal',
        amount: -amount,
        status: 'success',
        description: 'Withdrawal',
        createdAt: new Date().toISOString()
      });

      writeDB(db);

      const wallet = calculateWallet(db, userId);

      return res.json({
        success: true,
        message: `₹${amount.toFixed(2)} withdrawn successfully`,
        balance: wallet.balance,
        winningBalance: wallet.winning,
        totalBalance: wallet.total
      });
    } catch (error) {
      console.error('WALLET DEMO WITHDRAW:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to withdraw money'
      });
    }
  });




  app.get('/api/wallet/transactions', authenticateToken, (req, res) => {
    try {
      const db = readDB();
      const userId = getUserId(req);

      const transactions = getUserTransactions(db, userId)
        .slice()
        .sort((a, b) => transactionTime(b) - transactionTime(a));

      return res.json({
        success: true,
        transactions
      });

    } catch (error) {
      console.error('Transaction history failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to load transaction history'
      });
    }
  });


  // ============================================================
  // CONTEST JOIN
  // ============================================================

  app.post(
    '/api/contests/:contestId/join',
    authenticateToken,
    (req, res) => {
      try {
        const db = readDB();

        if (!Array.isArray(db.contestEntries)) {
          db.contestEntries = [];
        }

        if (!Array.isArray(db.transactions)) {
          db.transactions = [];
        }

        const userId = getUserId(req);
        const contestId = Number(req.params.contestId);
        const teamId = req.body?.teamId ?? req.body?.team_id;

        if (!teamId) {
          return res.status(400).json({
            success: false,
            message: 'teamId is required'
          });
        }

        const contest = (db.contests || []).find(
          x => Number(x.id) === contestId
        );

        if (!contest) {
          return res.status(404).json({
            success: false,
            message: 'Contest not found'
          });
        }

        const matchId = Number(
          contest.match_id ?? contest.matchId
        );

        const team = (db.teams || []).find(
          x =>
            String(x.id) === String(teamId) &&
            String(x.user_id) === userId &&
            Number(x.match_id) === matchId
        );

        if (!team) {
          return res.status(404).json({
            success: false,
            message: 'Valid team for this contest not found'
          });
        }

        const alreadyJoined = db.contestEntries.find(
          entry =>
            Number(entry.contestId ?? entry.contest_id) === contestId &&
            String(entry.userId ?? entry.user_id) === userId &&
            String(entry.teamId ?? entry.team_id) === String(teamId)
        );

        if (alreadyJoined) {
          return res.status(409).json({
            success: false,
            message: 'This team has already joined the contest',
            entry: alreadyJoined
          });
        }

        const maxSpots = contestMaxSpots(contest);
        const joinedSpots = contestJoinedCount(db, contestId);

        if (maxSpots > 0 && joinedSpots >= maxSpots) {
          return res.status(400).json({
            success: false,
            message: 'Contest is full'
          });
        }

        const entryFee = contestEntryFee(contest);

        const wallet = calculateWallet(db, userId);

        if (entryFee > 0 && wallet.balance < entryFee) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance',
            required: entryFee,
            available: wallet.balance
          });
        }

        const now = new Date().toISOString();

        const entry = {
          id: generateId('entry'),
          contestId,
          contest_id: contestId,
          matchId,
          match_id: matchId,
          userId,
          user_id: userId,
          teamId,
          team_id: teamId,
          entryFee,
          entry_fee: entryFee,
          points: 0,
          rank: null,
          prize: 0,
          status: 'joined',
          createdAt: now,
          created_at: now
        };

        if (entryFee > 0) {
          db.transactions.push({
            id: generateId('tx'),
            userId,
            user_id: userId,
            type: 'entry_fee',
            amount: entryFee,
            status: 'success',
            reference: `contest-entry-${entry.id}`,
            contestId,
            contest_id: contestId,
            teamId,
            team_id: teamId,
            createdAt: now,
            created_at: now
          });
        }

        db.contestEntries.push(entry);

        contest.joinedSpots = joinedSpots + 1;
        contest.joined_spots = joinedSpots + 1;

        writeDB(db);

        const updatedWallet = calculateWallet(db, userId);

        return res.status(201).json({
          success: true,
          message: 'Contest joined successfully',
          entry,
          wallet: updatedWallet,
          contest: {
            ...contest,
            entryFee,
            joinedSpots: joinedSpots + 1,
            maxSpots
          }
        });

      } catch (error) {
        console.error('Contest join failed:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to join contest'
        });
      }
    }
  );


  // ============================================================
  // MY CONTESTS
  // ============================================================

  app.get('/api/my-contests', authenticateToken, (req, res) => {
    try {
      const db = readDB();
      const userId = getUserId(req);

      const entries = (db.contestEntries || [])
        .filter(
          entry =>
            String(entry.userId ?? entry.user_id) === userId
        )
        .map(entry => {
          const contest = (db.contests || []).find(
            x =>
              Number(x.id) ===
              Number(entry.contestId ?? entry.contest_id)
          );

          const match = (db.matches || []).find(
            x =>
              Number(x.id) ===
              Number(entry.matchId ?? entry.match_id)
          );

          return {
            ...entry,
            contestName: contest?.name || 'Contest',
            matchName: match?.title || 'Match',
            joinedSpots: contest
              ? contestJoinedCount(db, contest.id)
              : 0,
            maxSpots: contest
              ? contestMaxSpots(contest)
              : 0
          };
        })
        .sort(
          (a, b) =>
            transactionTime(b) - transactionTime(a)
        );

      return res.json({
        success: true,
        contests: entries
      });

    } catch (error) {
      console.error('My contests failed:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to load joined contests'
      });
    }
  });


  // ============================================================
  // CONTEST LEADERBOARD
  // ============================================================

  app.get(
    '/api/contests/:contestId/leaderboard',
    (req, res) => {
      try {
        const db = readDB();
        const contestId = Number(req.params.contestId);

        const contest = (db.contests || []).find(
          x => Number(x.id) === contestId
        );

        if (!contest) {
          return res.status(404).json({
            success: false,
            message: 'Contest not found'
          });
        }

        const entries = (db.contestEntries || [])
          .filter(
            entry =>
              Number(
                entry.contestId ?? entry.contest_id
              ) === contestId
          )
          .map(entry => ({
            ...entry,
            points: Number(entry.points || 0)
          }))
          .sort((a, b) => {
            if (b.points !== a.points) {
              return b.points - a.points;
            }

            return (
              transactionTime(a) -
              transactionTime(b)
            );
          })
          .map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));

        return res.json({
          success: true,
          contest: {
            ...contest,
            entryFee: contestEntryFee(contest),
            joinedSpots: entries.length,
            maxSpots: contestMaxSpots(contest)
          },
          leaderboard: entries
        });

      } catch (error) {
        console.error('Leaderboard failed:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to load leaderboard'
        });
      }
    }
  );


  // ============================================================
  // ADMIN / SCORE UPDATE HELPER
  // TEMPORARY INTERNAL API
  // ============================================================

  app.post(
    '/api/contests/:contestId/entries/:entryId/score',
    authenticateToken,
    (req, res) => {
      try {
        const db = readDB();

        const contestId = Number(req.params.contestId);
        const entryId = String(req.params.entryId);
        const points = Number(req.body?.points);

        if (!Number.isFinite(points)) {
          return res.status(400).json({
            success: false,
            message: 'Valid points are required'
          });
        }

        const entry = (db.contestEntries || []).find(
          item =>
            String(item.id) === entryId &&
            Number(
              item.contestId ?? item.contest_id
            ) === contestId
        );

        if (!entry) {
          return res.status(404).json({
            success: false,
            message: 'Contest entry not found'
          });
        }

        entry.points = points;
        entry.updatedAt = new Date().toISOString();

        writeDB(db);

        return res.json({
          success: true,
          message: 'Score updated successfully',
          entry
        });

      } catch (error) {
        console.error('Score update failed:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to update score'
        });
      }
    }
  );


  // ============================================================
  // PRACTICE CONTEST SETTLEMENT
  // INTERNAL / TEST FLOW
  // ============================================================

  app.post(
    '/api/contests/:contestId/settle',
    authenticateToken,
    (req, res) => {
      try {
        const db = readDB();

        const contestId = Number(req.params.contestId);

        if (!Number.isFinite(contestId)) {
          return res.status(400).json({
            success: false,
            message: 'Valid contest ID is required'
          });
        }

        const contest = (db.contests || []).find(
          item => Number(item.id) === contestId
        );

        if (!contest) {
          return res.status(404).json({
            success: false,
            message: 'Contest not found'
          });
        }

        // Safety: this settlement endpoint is for practice/virtual contests.
        const entryFee = contestEntryFee(contest);

        if (entryFee > 0) {
          return res.status(403).json({
            success: false,
            message: 'This settlement endpoint supports practice contests only'
          });
        }

        const entries = (db.contestEntries || [])
          .filter(
            item =>
              Number(item.contestId ?? item.contest_id) === contestId
          );

        if (!entries.length) {
          return res.status(400).json({
            success: false,
            message: 'No contest entries available for settlement'
          });
        }

        const alreadySettled = entries.some(
          item =>
            item.status === 'winner' ||
            item.status === 'settled'
        );

        if (alreadySettled) {
          return res.status(409).json({
            success: false,
            message: 'Contest already settled'
          });
        }

        const ranked = entries
          .slice()
          .sort(
            (a, b) =>
              Number(b.points || 0) -
              Number(a.points || 0)
          )
          .map(
            (entry, index) => ({
              entry,
              rank: index + 1
            })
          );

        const now = new Date().toISOString();

        if (!Array.isArray(db.transactions)) {
          db.transactions = [];
        }

        if (!Array.isArray(db.wallets)) {
          db.wallets = [];
        }

        const settlement = [];

        ranked.forEach(({ entry, rank }) => {
          entry.rank = rank;
          entry.updatedAt = now;

          // Practice contest: no real-money prize.
          // Virtual prize can be shown in the settlement result,
          // but no wallet money is credited.
          entry.prize = 0;
          entry.status = rank === 1 ? 'winner' : 'settled';

          settlement.push({
            entryId: entry.id,
            userId: String(entry.userId ?? entry.user_id),
            rank,
            points: Number(entry.points || 0),
            prize: 0,
            status: entry.status
          });
        });

        contest.status = 'settled';
        contest.settledAt = now;
        contest.updatedAt = now;

        writeDB(db);

        return res.json({
          success: true,
          message: 'Practice contest settled successfully',
          contest: {
            id: contest.id,
            name: contest.name,
            status: contest.status,
            settledAt: contest.settledAt
          },
          leaderboard: ranked.map(({ entry }) => entry),
          settlement
        });

      } catch (error) {
        console.error('Contest settlement failed:', error);

        return res.status(500).json({
          success: false,
          message: 'Failed to settle contest'
        });
      }
    }
  );


}

module.exports = { registerRoutes };
