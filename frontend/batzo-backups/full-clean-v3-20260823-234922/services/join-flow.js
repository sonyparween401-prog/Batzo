const CONTESTS_KEY = "batzo_my_contests";
const JOIN_LOCK_KEY = "batzo_join_lock";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWalletBalance() {
  const wallet = readJSON("batzo_wallet", null);

  if (wallet && Number.isFinite(Number(wallet.balance))) {
    return Number(wallet.balance);
  }

  const raw = localStorage.getItem("batzo_wallet_balance");

  if (raw !== null && Number.isFinite(Number(raw))) {
    return Number(raw);
  }

  return 0;
}

export function getMyContests() {
  return readJSON(CONTESTS_KEY, []);
}

export function isAlreadyJoined(contestId, teamId) {
  return getMyContests().some(
    item =>
      String(item.contestId) === String(contestId) &&
      String(item.teamId) === String(teamId)
  );
}

export function joinContest({
  matchId,
  contestId,
  teamId,
  entryFee = 0,
  contestName = "Contest",
  prizePool = "₹0"
}) {
  if (!matchId) {
    return {
      ok: false,
      code: "MATCH_REQUIRED",
      message: "Please select a match."
    };
  }

  if (!contestId) {
    return {
      ok: false,
      code: "CONTEST_REQUIRED",
      message: "Please select a contest."
    };
  }

  if (!teamId) {
    return {
      ok: false,
      code: "TEAM_REQUIRED",
      message: "Please select a fantasy team."
    };
  }

  const fee = Math.max(0, Number(entryFee) || 0);
  const balance = getWalletBalance();

  if (isAlreadyJoined(contestId, teamId)) {
    return {
      ok: false,
      code: "ALREADY_JOINED",
      message: "This team has already joined this contest."
    };
  }

  if (balance < fee) {
    return {
      ok: false,
      code: "INSUFFICIENT_BALANCE",
      message: `Wallet balance ₹${balance} is insufficient for ₹${fee} entry fee.`
    };
  }

  const lock = sessionStorage.getItem(JOIN_LOCK_KEY);

  if (lock && Date.now() - Number(lock) < 5000) {
    return {
      ok: false,
      code: "JOIN_IN_PROGRESS",
      message: "Join request is already processing."
    };
  }

  sessionStorage.setItem(JOIN_LOCK_KEY, String(Date.now()));

  try {
    const joinedAt = new Date().toISOString();

    const record = {
      id:
        "join_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 8),

      matchId: String(matchId),
      contestId: String(contestId),
      teamId: String(teamId),

      contestName,
      prizePool,
      entryFee: fee,

      joinedAt,
      status: "JOINED"
    };

    const contests = getMyContests();

    contests.unshift(record);

    writeJSON(CONTESTS_KEY, contests);

    if (fee > 0) {
      const newBalance = balance - fee;

      localStorage.setItem(
        "batzo_wallet_balance",
        String(newBalance)
      );

      const wallet = readJSON("batzo_wallet", {});

      writeJSON("batzo_wallet", {
        ...wallet,
        balance: newBalance,
        lastTransaction: {
          type: "CONTEST_ENTRY",
          amount: fee,
          contestId: String(contestId),
          teamId: String(teamId),
          createdAt: joinedAt
        }
      });

      const ledger = readJSON("batzo_wallet_ledger", []);

      ledger.unshift({
        id: "txn_" + Date.now(),
        type: "CONTEST_ENTRY",
        amount: fee,
        contestId: String(contestId),
        teamId: String(teamId),
        createdAt: joinedAt
      });

      writeJSON("batzo_wallet_ledger", ledger);
    }

    localStorage.removeItem("batzo_pending_contest");

    window.dispatchEvent(
      new CustomEvent("batzo:contest-joined", {
        detail: record
      })
    );

    window.dispatchEvent(
      new CustomEvent("batzo:wallet-updated", {
        detail: {
          balance: getWalletBalance(),
          amount: fee
        }
      })
    );

    return {
      ok: true,
      code: "JOINED",
      data: record,
      balance: getWalletBalance()
    };
  } finally {
    sessionStorage.removeItem(JOIN_LOCK_KEY);
  }
}

export function savePendingContest(contest) {
  writeJSON("batzo_pending_contest", contest || {});
}

export function getPendingContest() {
  return readJSON("batzo_pending_contest", null);
}

export function clearPendingContest() {
  localStorage.removeItem("batzo_pending_contest");
}
