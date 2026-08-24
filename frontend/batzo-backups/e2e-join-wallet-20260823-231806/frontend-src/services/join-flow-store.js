const KEY = "batzo_join_entries_v1";

function readEntries() {
  try {
    const value = localStorage.getItem(KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  return entries;
}

function id(value) {
  return value == null ? "" : String(value);
}

export function getJoinEntries() {
  return readEntries();
}

export function getMyContests(userId = "local-user") {
  return readEntries().filter(
    (entry) => id(entry.userId) === id(userId)
  );
}

export function getContestEntries(contestId) {
  return readEntries().filter(
    (entry) => id(entry.contestId) === id(contestId)
  );
}

export function hasJoined({
  userId = "local-user",
  contestId,
}) {
  return readEntries().some(
    (entry) =>
      id(entry.userId) === id(userId) &&
      id(entry.contestId) === id(contestId)
  );
}

export function getTeamsForMatch(teams = [], matchId) {
  return teams.filter(
    (team) =>
      !team.matchId ||
      id(team.matchId) === id(matchId)
  );
}

export function createJoinEntry({
  userId = "local-user",
  matchId,
  contestId,
  teamId,
  entryFee = 0,
  contestName = "Fantasy Contest",
  matchName = "Cricket Match",
}) {
  if (!matchId) throw new Error("Match ID is required.");
  if (!contestId) throw new Error("Contest ID is required.");
  if (!teamId) throw new Error("Team ID is required.");

  const entries = readEntries();

  const duplicate = entries.find(
    (entry) =>
      id(entry.userId) === id(userId) &&
      id(entry.contestId) === id(contestId)
  );

  if (duplicate) {
    throw new Error("You have already joined this contest.");
  }

  const entry = {
    id: `join_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    userId,
    matchId,
    contestId,
    teamId,
    contestName,
    matchName,
    entryFee: Number(entryFee || 0),
    status: "JOINED",
    joinedAt: new Date().toISOString(),
  };

  writeEntries([...entries, entry]);
  return entry;
}
EOF && \

echo "[3/14] MATCH-BOUND TEAM STORE..." && \
cat > frontend/src/services/team-store.js <<'EOF'
const KEY = "batzo_teams_v2";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function getTeams() {
  return read();
}

export function getTeamsForMatch(matchId) {
  const teams = read();

  return teams.filter(
    (team) =>
      !team.matchId ||
      String(team.matchId) === String(matchId)
  );
}

export function saveTeam(team = {}) {
  const teams = read();

  const normalized = {
    ...team,
    id:
      team.id ||
      `team_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    players: Array.isArray(team.players) ? team.players : [],
    matchId: team.matchId || null,
    updatedAt: new Date().toISOString(),
  };

  const index = teams.findIndex(
    (item) => String(item.id) === String(normalized.id)
  );

  if (index >= 0) {
    teams[index] = normalized;
  } else {
    teams.push(normalized);
  }

  write(teams);
  return normalized;
}
EOF && \

echo "[4/14] WALLET JOIN-SAFE STORE..." && \
cat > frontend/src/services/wallet-store.js <<'EOF'
const KEY = "batzo_wallet_v2";

function defaultWallet() {
  return {
    balance: 0,
    winnings: 0,
    deposited: 0,
    bonus: 0,
    transactions: [],
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const wallet = raw ? JSON.parse(raw) : defaultWallet();

    return {
      ...defaultWallet(),
      ...wallet,
      transactions: Array.isArray(wallet.transactions)
        ? wallet.transactions
        : [],
    };
  } catch {
    return defaultWallet();
  }
}

function write(wallet) {
  localStorage.setItem(KEY, JSON.stringify(wallet));
  return wallet;
}

export function getWallet() {
  return read();
}

export function getWalletBalance() {
  return Number(read().balance || 0);
}

export function canJoinWithWallet(amount = 0) {
  const value = Number(amount || 0);

  if (!Number.isFinite(value) || value < 0) {
    return {
      valid: false,
      reason: "Invalid entry fee.",
    };
  }

  const wallet = read();

  if (wallet.balance < value) {
    return {
      valid: false,
      reason: `Insufficient wallet balance. Required ₹${value}, available ₹${wallet.balance}.`,
    };
  }

  return {
    valid: true,
    wallet,
  };
}

export function debitForContest({
  amount = 0,
  contestId,
  matchId,
  teamId,
}) {
  const value = Number(amount || 0);
  const wallet = read();

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid contest entry fee.");
  }

  if (wallet.balance < value) {
    throw new Error(
      `Insufficient wallet balance. Required ₹${value}, available ₹${wallet.balance}.`
    );
  }

  const updated = {
    ...wallet,
    balance: Number((wallet.balance - value).toFixed(2)),
    transactions: [
      ...wallet.transactions,
      {
        id: `txn_${Date.now()}`,
        type: "CONTEST_ENTRY",
        amount: -value,
        contestId,
        matchId,
        teamId,
        status: "SUCCESS",
        createdAt: new Date().toISOString(),
      },
    ],
  };

  return write(updated);
}
EOF && \

echo "[5/14] MY CONTESTS COMPONENT..." && \
cat > frontend/src/contest/MyContests.jsx <<'EOF'
import React from "react";
import { getMyContests } from "../services/join-flow-store";
import { formatINR } from "../wallet/walletFoundation";

export default function MyContests({
  userId = "local-user",
}) {
  const entries = getMyContests(userId);

  return (
    <section style={{ padding: 16 }}>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.4,
            opacity: 0.6,
          }}
        >
          BATZO
        </div>

        <h2 style={{ margin: "4px 0" }}>
          My Contests
        </h2>
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            padding: 22,
            borderRadius: 16,
            background: "rgba(255,255,255,.05)",
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          No joined contests yet.
        </div>
      ) : (
        entries.map((entry) => (
          <article
            key={entry.id}
            style={{
              padding: 15,
              marginBottom: 12,
              borderRadius: 16,
              background:
                "linear-gradient(145deg,#171b20,#0c0f12)",
              border:
                "1px solid rgba(255,255,255,.08)",
            }}
          >
            <strong>{entry.contestName}</strong>

            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                opacity: 0.75,
              }}
            >
              {entry.matchName}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <span>
                Entry: {formatINR(entry.entryFee)}
              </span>

              <b>{entry.status}</b>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
EOF && \

echo "[6/14] CONTEST JOIN CONTROLLER..." && \
cat > frontend/src/contest/joinContest.js <<'EOF'
import {
  createJoinEntry,
  hasJoined,
} from "../services/join-flow-store";

import {
  canJoinWithWallet,
  debitForContest,
} from "../services/wallet-store";

import { validateFantasyTeam } from "../fantasy/teamRules";

export function joinContest({
  userId = "local-user",
  match,
  contest,
  team,
}) {
  const matchId =
    match?.id ||
    match?.matchId ||
    match?._id;

  const contestId =
    contest?.id ||
    contest?.contestId ||
    contest?._id;

  const teamId =
    team?.id ||
    team?.teamId;

  if (!matchId) {
    return {
      success: false,
      reason: "Match is not selected.",
    };
  }

  if (!contestId) {
    return {
      success: false,
      reason: "Contest is not selected.",
    };
  }

  if (!teamId) {
    return {
      success: false,
      reason: "Please select a team.",
    };
  }

  if (hasJoined({ userId, contestId })) {
    return {
      success: false,
      reason: "You have already joined this contest.",
    };
  }

  const players = Array.isArray(team.players)
    ? team.players
    : [];

  if (players.length !== 11) {
    return {
      success: false,
      reason: "Team must contain exactly 11 players.",
    };
  }

  const validation = validateFantasyTeam(players);

  if (!validation.valid) {
    return {
      success: false,
      reason: validation.errors.join(" "),
    };
  }

  const teamMatchId = team.matchId;

  if (
    teamMatchId &&
    String(teamMatchId) !== String(matchId)
  ) {
    return {
      success: false,
      reason:
        "This team belongs to a different match.",
    };
  }

  const entryFee = Number(
    contest.entryFee ||
    contest.entry ||
    0
  );

  const walletCheck =
    canJoinWithWallet(entryFee);

  if (!walletCheck.valid) {
    return {
      success: false,
      reason: walletCheck.reason,
    };
  }

  try {
    debitForContest({
      amount: entryFee,
      contestId,
      matchId,
      teamId,
    });

    const entry = createJoinEntry({
      userId,
      matchId,
      contestId,
      teamId,
      entryFee,
      contestName:
        contest.name ||
        "Fantasy Contest",
      matchName:
        match.name ||
        match.title ||
        "Cricket Match",
    });

    return {
      success: true,
      entry,
    };
  } catch (error) {
    return {
      success: false,
      reason:
        error?.message ||
        "Unable to join contest.",
    };
  }
}
EOF && \

echo "[7/14] CONTEST UI JOIN HOOK..." && \
cat >> frontend/src/contest/ContestSystem.jsx <<'EOF'

