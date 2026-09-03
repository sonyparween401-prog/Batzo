const KEYS = {
  joined: "batzo_joined_contests",
  pending: "batzo_pending_contest",
  ledger: "batzo_wallet_ledger",
  teams: "batzo_saved_teams"
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : 0;
}





function normalizeContest(input) {
  if (!input) return {};

  if (typeof input === "string" || typeof input === "number") {
    return {
      contestId: String(input)
    };
  }

  return {
    ...input,
    contestId: String(
      input.contestId ??
      input.id ??
      input._id ??
      input.contest_id ??
      ""
    ),
    matchId: String(
      input.matchId ??
      input.match_id ??
      input.match?.id ??
      input.match?.matchId ??
      ""
    ),
    entryFee: money(
      input.entryFee ??
      input.entry_fee ??
      input.fee ??
      input.entry ??
      0
    )
  };
}

function normalizeTeam(input) {
  if (!input) return {};

  if (typeof input === "string" || typeof input === "number") {
    return {
      teamId: String(input)
    };
  }

  return {
    ...input,
    teamId: String(
      input.teamId ??
      input.id ??
      input.team_id ??
      ""
    )
  };
}

export function savePendingContest(contest, team = null) {
  const data = {
    contest: normalizeContest(contest),
    team: normalizeTeam(team),
    savedAt: Date.now()
  };

  write(KEYS.pending, data);

  window.dispatchEvent(
    new CustomEvent("batzo:pending-contest", { detail: data })
  );

  return data;
}

export function getPendingContest() {
  return read(KEYS.pending, null);
}

export function clearPendingContest() {
  localStorage.removeItem(KEYS.pending);
}

export function getJoinedContests() {
  return read(KEYS.joined, []);
}

export function getMyContests() {
  return getJoinedContests();
}





export function getSavedTeams() {
  return read(KEYS.teams, []);
}

export function saveTeam(team) {
  const normalized = normalizeTeam(team);
  const teams = getSavedTeams();

  const index = teams.findIndex(
    t => String(t.teamId || "") === String(normalized.teamId || "")
  );

  if (index >= 0) {
    teams[index] = {
      ...teams[index],
      ...normalized,
      updatedAt: Date.now()
    };
  } else {
    teams.push({
      ...normalized,
      createdAt: Date.now()
    });
  }

  write(KEYS.teams, teams);

  window.dispatchEvent(
    new CustomEvent("batzo:team-saved", { detail: normalized })
  );

  return normalized;
}

export function joinContest(contestInput, teamInput = null) {
  const contest = normalizeContest(contestInput);
  const team = normalizeTeam(teamInput);

  if (!contest.contestId) {
    return {
      ok: false,
      success: false,
      error: "Contest ID missing"
    };
  }

  if (!team.teamId) {
    return {
      ok: false,
      success: false,
      error: "Please select a team"
    };
  }

  const joined = getJoinedContests();

  const duplicate = joined.find(
    item =>
      String(item.contestId) === String(contest.contestId) &&
      String(item.teamId) === String(team.teamId)
  );

  if (duplicate) {
    return {
      ok: false,
      success: false,
      duplicate: true,
      error: "This team has already joined this contest",
      data: duplicate
    };
  }

  const fee = money(contest.entryFee);
  if (fee > wallet.balance) {
    savePendingContest(contest, team);

    return {
      ok: false,
      success: false,
      insufficientBalance: true,
      required: fee,
      balance: wallet.balance,
      error: `Insufficient wallet balance. Entry fee ₹${fee}. Wallet ₹${wallet.balance}.`
    };
  }

  const joinedAt = Date.now();

  const record = {
    id: `${contest.contestId}_${team.teamId}_${joinedAt}`,
    contestId: contest.contestId,
    matchId: contest.matchId || "",
    teamId: team.teamId,
    contestName:
      contest.name ||
      contest.title ||
      contest.contestName ||
      "Contest",
    matchName:
      contest.matchName ||
      contest.match ||
      "",
    entryFee: fee,
    joinedAt,
    status: "JOINED",
    contest: contest,
    team: team
  };

  if (fee > 0) {
    saveWallet({
      balance: wallet.balance - fee
    });
  }

  joined.unshift(record);
  write(KEYS.joined, joined);

  ledger.unshift({
    id: `entry_${joinedAt}`,
    type: "ENTRY",
    amount: fee,
    contestId: contest.contestId,
    teamId: team.teamId,
    createdAt: joinedAt,
    description: `Contest entry - ${record.contestName}`
  });

  write(KEYS.ledger, ledger);

  clearPendingContest();

  window.dispatchEvent(
    new CustomEvent("batzo:contest-joined", {
      detail: record
    })
  );

  return {
    ok: true,
    success: true,
    joined: true,
    data: record,
  };
}

export function isContestJoined(contestId, teamId) {
  return getJoinedContests().some(
    item =>
      String(item.contestId) === String(contestId) &&
      String(item.teamId) === String(teamId)
  );
}

export function leaveLocalContest(contestId, teamId) {
  const current = getJoinedContests();

  const filtered = current.filter(
    item =>
      !(
        String(item.contestId) === String(contestId) &&
        String(item.teamId) === String(teamId)
      )
  );

  write(KEYS.joined, filtered);

  return filtered;
}

export function addWalletCredit(amount, description = "Wallet credit") {
  const value = money(amount);

  if (value <= 0) {
    return {
      ok: false,
      error: "Invalid wallet amount"
    };
  }

  const updated = saveWallet({
    balance: wallet.balance + value
  });

  ledger.unshift({
    id: `credit_${Date.now()}`,
    type: "CREDIT",
    amount: value,
    createdAt: Date.now(),
    description
  });

  write(KEYS.ledger, ledger);

  return {
    ok: true,
  };
}

export function refreshFlowState() {
  window.dispatchEvent(
    new CustomEvent("batzo:flow-updated", {
      detail: {
        joined: getJoinedContests(),
        pending: getPendingContest()
      }
    })
  );
}

export default {
  joinContest,
  savePendingContest,
  getPendingContest,
  getJoinedContests,
  getMyContests,
  getSavedTeams,
  saveTeam,
  isContestJoined,
  leaveLocalContest,
  addWalletCredit,
  refreshFlowState
};
