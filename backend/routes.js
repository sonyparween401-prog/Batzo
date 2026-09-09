const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  if (!Array.isArray(db.deposits)) db.deposits = [];

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

function ensureWalletCollections(db) {
  if (!Array.isArray(db.transactions)) db.transactions = [];
  if (!Array.isArray(db.contestEntries)) db.contestEntries = [];
  if (!Array.isArray(db.withdrawals)) db.withdrawals = [];
  if (!Array.isArray(db.kycRequests)) db.kycRequests = [];
  if (!Array.isArray(db.walletIdempotency)) db.walletIdempotency = [];
}

function requireAdminKey(req, res, next) {
  const configured = String(process.env.ADMIN_API_KEY || '');
  const supplied = String(req.get('x-admin-key') || '');

  if (configured.length < 32 || supplied !== configured) {
    return res.status(403).json({
      success: false,
      message: 'Admin authorization required'
    });
  }

  next();
}

function idempotencyKey(req, fallback) {
  return String(req.get('idempotency-key') || fallback || '').trim();
}

function rememberIdempotency(db, key, response) {
  if (!key) return;
  db.walletIdempotency.push({ key, response, createdAt: new Date().toISOString() });
}

function previousIdempotentResponse(db, key) {
  if (!key) return null;
  return db.walletIdempotency.find(item => item.key === key)?.response || null;
}

function pendingWithdrawalTotal(db, userId) {
  return money(db.withdrawals
    .filter(item =>
      String(item.userId) === String(userId) &&
      ['pending', 'processing'].includes(String(item.status).toLowerCase())
    )
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0));
}

function cashfreeConfig() {
  const appId = String(process.env.CASHFREE_APP_ID || '').trim();
  const secretKey = String(process.env.CASHFREE_SECRET_KEY || '').trim();
  const environment = String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
  return {
    appId,
    secretKey,
    environment,
    baseUrl: environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg'
  };
}

async function cashfreeRequest(endpoint, options = {}) {
  const config = cashfreeConfig();
  if (!config.appId || !config.secretKey) {
    const error = new Error('Cashfree is not configured');
    error.status = 503;
    error.code = 'CASHFREE_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch(config.baseUrl + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2025-01-01',
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.type || 'Cashfree request failed');
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function creditCashfreeDeposit(db, deposit, paymentReference) {
  const reference = `cashfree-deposit:${deposit.orderId}`;
  const existing = db.transactions.find(tx => tx.reference === reference);
  if (existing) return existing;
  const transaction = {
    id: generateId('tx'), userId: deposit.userId, type: 'deposit',
    amount: deposit.amount, status: 'success', reference,
    provider: 'cashfree', providerReference: String(paymentReference || ''),
    description: 'Cashfree Add Money', createdAt: new Date().toISOString()
  };
  db.transactions.push(transaction);
  deposit.status = 'success';
  deposit.paymentReference = transaction.providerReference;
  deposit.updatedAt = transaction.createdAt;
  return transaction;
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

      ensureWalletCollections(db);

      const wallet = calculateWallet(db, userId);

      const pendingWithdrawal = pendingWithdrawalTotal(db, userId);

      const transactions = getUserTransactions(db, userId)
        .slice()
        .sort((a, b) => transactionTime(b) - transactionTime(a));

      return res.json({
        success: true,
        balance: wallet.balance,
        winning: wallet.winning,
        winningBalance: wallet.winning,
        total: wallet.total,
        totalBalance: wallet.total,
        pendingWithdrawal,
        withdrawableWinning: money(Math.max(0, wallet.winning - pendingWithdrawal)),
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

  app.post('/api/wallet/deposit/order', authenticateToken, async (req, res) => {
    try {
      const db = readDB();
      ensureWalletCollections(db);
      const userId = getUserId(req);
      const amount = money(req.body?.amount);
      const requestId = String(req.body?.requestId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 30);
      const key = idempotencyKey(req, requestId ? `cashfree-order:${userId}:${requestId}` : '');
      const previous = previousIdempotentResponse(db, key);
      if (previous) return res.json(previous);
      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({ success: false, message: 'Enter an amount between ₹1 and ₹100000' });
      }
      if (!requestId || !key) {
        return res.status(400).json({ success: false, message: 'A unique requestId and Idempotency-Key are required' });
      }
      const user = (db.users || []).find(item => String(item.id) === userId) || {};
      const orderId = `batzo_${userId}_${requestId}`.slice(0, 45);
      const order = await cashfreeRequest('/orders', {
        method: 'POST',
        headers: { 'x-idempotency-key': key.slice(0, 40) },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: `batzo_${userId}`,
            customer_name: String(user.name || 'Batzo User').slice(0, 100),
            customer_email: String(user.email || 'support@batzo.app'),
            customer_phone: String(user.mobile || '9999999999').replace(/\D/g, '').slice(-10)
          },
          order_note: 'BATZO wallet add money'
        })
      });
      const deposit = {
        id: generateId('deposit'), orderId, cfOrderId: order.cf_order_id,
        userId, amount, status: 'pending', provider: 'cashfree',
        createdAt: new Date().toISOString()
      };
      db.deposits.push(deposit);
      const response = {
        success: true, orderId, paymentSessionId: order.payment_session_id,
        environment: cashfreeConfig().environment
      };
      rememberIdempotency(db, key, response);
      writeDB(db);
      return res.status(201).json(response);
    } catch (error) {
      console.error('CASHFREE CREATE ORDER:', error.details || error);
      return res.status(error.status || 502).json({
        success: false, code: error.code || 'CASHFREE_ORDER_FAILED',
        message: error.message || 'Unable to create payment order'
      });
    }
  });

  app.get('/api/wallet/deposit/:orderId/status', authenticateToken, async (req, res) => {
    try {
      const db = readDB();
      ensureWalletCollections(db);
      const userId = getUserId(req);
      const deposit = db.deposits.find(item => item.orderId === req.params.orderId && String(item.userId) === userId);
      if (!deposit) return res.status(404).json({ success: false, message: 'Deposit order not found' });
      const order = await cashfreeRequest(`/orders/${encodeURIComponent(deposit.orderId)}`);
      if (order.order_status === 'PAID') {
        creditCashfreeDeposit(db, deposit, order.cf_order_id);
        writeDB(db);
      }
      return res.json({
        success: true, orderId: deposit.orderId, orderStatus: order.order_status,
        credited: deposit.status === 'success', wallet: calculateWallet(db, userId)
      });
    } catch (error) {
      console.error('CASHFREE ORDER STATUS:', error.details || error);
      return res.status(error.status || 502).json({ success: false, message: error.message || 'Unable to verify payment' });
    }
  });

  app.post('/api/wallet/cashfree/webhook', (req, res) => {
    try {
      const config = cashfreeConfig();
      const timestamp = String(req.get('x-webhook-timestamp') || '');
      const supplied = String(req.get('x-webhook-signature') || '');
      const rawBody = String(req.rawBody || '');
      const expected = crypto.createHmac('sha256', config.secretKey).update(timestamp + rawBody).digest('base64');
      const a = Buffer.from(supplied);
      const b = Buffer.from(expected);
      if (!supplied || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      }
      const order = req.body?.data?.order || {};
      const payment = req.body?.data?.payment || {};
      if (order.order_status === 'PAID' || payment.payment_status === 'SUCCESS') {
        const db = readDB();
        ensureWalletCollections(db);
        const deposit = db.deposits.find(item => item.orderId === order.order_id);
        if (deposit) {
          creditCashfreeDeposit(db, deposit, payment.cf_payment_id || order.cf_order_id);
          writeDB(db);
        }
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('CASHFREE WEBHOOK:', error);
      return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  });

  app.post('/api/wallet/demo/deposit', authenticateToken, (req, res) => {
    return res.status(503).json({
      success: false,
      code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      message: 'Add Money will be enabled after verified payment gateway setup.'
    });
    /* istanbul ignore next */
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
    return res.status(410).json({
      success: false,
      code: 'DEMO_WITHDRAWAL_DISABLED',
      message: 'Use the secure withdrawal request endpoint.'
    });
    /* istanbul ignore next */
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

  app.post('/api/wallet/kyc', authenticateToken, (req, res) => {
    try {
      const db = readDB();
      ensureWalletCollections(db);
      const userId = getUserId(req);
      const legalName = String(req.body?.legalName || '').trim();
      const panLast4 = String(req.body?.panLast4 || '').trim().toUpperCase();

      if (legalName.length < 3 || !/^[A-Z0-9]{4}$/.test(panLast4)) {
        return res.status(400).json({ success: false, message: 'Valid KYC details are required' });
      }

      let kyc = db.kycRequests.find(item => String(item.userId) === userId);
      const now = new Date().toISOString();
      if (kyc?.status === 'verified') {
        return res.json({ success: true, kyc });
      }
      if (!kyc) {
        kyc = { id: generateId('kyc'), userId, createdAt: now };
        db.kycRequests.push(kyc);
      }
      Object.assign(kyc, { legalName, panLast4, status: 'pending', updatedAt: now });
      writeDB(db);
      return res.status(202).json({ success: true, message: 'KYC submitted for verification', kyc });
    } catch (error) {
      console.error('KYC SUBMIT:', error);
      return res.status(500).json({ success: false, message: 'Unable to submit KYC' });
    }
  });

  app.patch('/api/admin/kyc/:kycId', requireAdminKey, (req, res) => {
    const db = readDB();
    ensureWalletCollections(db);
    const kyc = db.kycRequests.find(item => String(item.id) === String(req.params.kycId));
    const status = String(req.body?.status || '').toLowerCase();
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC request not found' });
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
    }
    kyc.status = status;
    kyc.reviewedAt = new Date().toISOString();
    writeDB(db);
    return res.json({ success: true, kyc });
  });

  app.post('/api/wallet/withdraw', authenticateToken, (req, res) => {
    try {
      const db = readDB();
      ensureWalletCollections(db);
      const userId = getUserId(req);
      const amount = money(req.body?.amount);
      const method = String(req.body?.method || '').toLowerCase();
      const destination = String(req.body?.destination || '').trim();
      const key = idempotencyKey(req, `withdraw:${userId}:${req.body?.requestId || ''}`);
      const previous = previousIdempotentResponse(db, key);
      if (previous) return res.json(previous);

      const kyc = db.kycRequests.find(item => String(item.userId) === userId && item.status === 'verified');
      if (!kyc) return res.status(403).json({ success: false, code: 'KYC_REQUIRED', message: 'Verified KYC is required' });
      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
        return res.status(400).json({ success: false, message: 'Enter a valid withdrawal amount' });
      }
      if (!['upi', 'bank'].includes(method) || destination.length < 3) {
        return res.status(400).json({ success: false, message: 'Valid UPI or bank destination is required' });
      }
      const wallet = calculateWallet(db, userId);
      const available = money(wallet.winning - pendingWithdrawalTotal(db, userId));
      if (amount > available) {
        return res.status(400).json({ success: false, message: 'Insufficient withdrawable winning balance', available });
      }
      const withdrawal = {
        id: generateId('withdrawal'), userId, amount, method, destination,
        status: 'pending', createdAt: new Date().toISOString()
      };
      db.withdrawals.push(withdrawal);
      const response = { success: true, message: 'Withdrawal request submitted', withdrawal };
      rememberIdempotency(db, key, response);
      writeDB(db);
      return res.status(202).json(response);
    } catch (error) {
      console.error('WITHDRAW REQUEST:', error);
      return res.status(500).json({ success: false, message: 'Unable to request withdrawal' });
    }
  });

  app.patch('/api/admin/withdrawals/:withdrawalId', requireAdminKey, (req, res) => {
    const db = readDB();
    ensureWalletCollections(db);
    const withdrawal = db.withdrawals.find(item => String(item.id) === String(req.params.withdrawalId));
    const status = String(req.body?.status || '').toLowerCase();
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    if (!['processing', 'success', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal status' });
    }
    if (['success', 'failed'].includes(withdrawal.status)) {
      return res.status(409).json({ success: false, message: 'Withdrawal is already final' });
    }
    if (status === 'success') {
      const reference = `withdrawal:${withdrawal.id}`;
      if (!db.transactions.some(tx => tx.reference === reference)) {
        db.transactions.push({
          id: generateId('tx'), userId: withdrawal.userId, type: 'withdrawal',
          amount: withdrawal.amount, status: 'success', reference,
          description: 'Withdrawal paid', createdAt: new Date().toISOString()
        });
      }
    }
    withdrawal.status = status;
    withdrawal.providerReference = String(req.body?.providerReference || '');
    withdrawal.updatedAt = new Date().toISOString();
    writeDB(db);
    return res.json({ success: true, withdrawal });
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
    '/api/admin/contest-entries/:entryId/refund',
    requireAdminKey,
    (req, res) => {
      try {
        const db = readDB();
        ensureWalletCollections(db);
        const entry = db.contestEntries.find(item => String(item.id) === String(req.params.entryId));
        if (!entry) return res.status(404).json({ success: false, message: 'Contest entry not found' });

        const amount = money(entry.entryFee ?? entry.entry_fee);
        const reference = `refund:${entry.id}`;
        const existing = db.transactions.find(tx => tx.reference === reference);
        if (existing) return res.json({ success: true, message: 'Entry was already refunded', transaction: existing });
        if (amount <= 0) {
          entry.status = 'refunded';
          entry.refundedAt = new Date().toISOString();
          writeDB(db);
          return res.json({ success: true, message: 'Free entry marked refunded', entry });
        }

        const transaction = {
          id: generateId('tx'), userId: String(entry.userId ?? entry.user_id),
          type: 'refund', amount, status: 'success', reference,
          contestId: Number(entry.contestId ?? entry.contest_id),
          description: 'Contest entry refund', createdAt: new Date().toISOString()
        };
        db.transactions.push(transaction);
        entry.status = 'refunded';
        entry.refundedAt = transaction.createdAt;
        writeDB(db);
        return res.json({ success: true, message: 'Contest entry refunded', transaction, entry });
      } catch (error) {
        console.error('ENTRY REFUND:', error);
        return res.status(500).json({ success: false, message: 'Refund failed' });
      }
    }
  );

  app.post(
    '/api/contests/:contestId/settle',
    authenticateToken,
    requireAdminKey,
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

        const entryFee = contestEntryFee(contest);
        const requestedPrizes = Array.isArray(req.body?.prizes) ? req.body.prizes : [];
        const prizeByEntry = new Map(
          requestedPrizes.map(item => [String(item.entryId), money(item.amount)])
        );

        if (entryFee > 0 && requestedPrizes.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Paid contest settlement requires an explicit prizes list'
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
          const prize = money(prizeByEntry.get(String(entry.id)) || 0);
          entry.prize = prize;
          entry.status = prize > 0 ? 'winner' : 'settled';

          if (prize > 0) {
            const reference = `winning:${contestId}:${entry.id}`;
            if (!db.transactions.some(tx => tx.reference === reference)) {
              db.transactions.push({
                id: generateId('tx'),
                userId: String(entry.userId ?? entry.user_id),
                type: 'winning', amount: prize, status: 'success', reference,
                contestId, entryId: entry.id, description: 'Contest winnings',
                createdAt: now
              });
            }
          }

          settlement.push({
            entryId: entry.id,
            userId: String(entry.userId ?? entry.user_id),
            rank,
            points: Number(entry.points || 0),
            prize,
            status: entry.status
          });
        });

        contest.status = 'settled';
        contest.settledAt = now;
        contest.updatedAt = now;

        writeDB(db);

        return res.json({
          success: true,
          message: 'Contest settled successfully',
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
