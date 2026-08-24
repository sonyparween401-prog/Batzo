const KEY = "batzo_contest_entries";

export function getContestEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function joinContest({
  contestId,
  teamId,
  entryFee,
  balance
}) {

  const fee = Number(entryFee);
  const wallet = Number(balance);

  if (!contestId)
    throw new Error("Contest required");

  if (!teamId)
    throw new Error("Team required");

  if (!Number.isFinite(fee) || fee <= 0)
    throw new Error("Invalid entry fee");

  if (!Number.isFinite(wallet) || wallet < fee)
    throw new Error("Insufficient wallet balance");

  const entries = getContestEntries();

  const entry = {
    id:"entry-" + Date.now(),
    contestId,
    teamId,
    entryFee:fee,
    createdAt:new Date().toISOString()
  };

  entries.push(entry);

  localStorage.setItem(KEY,JSON.stringify(entries));

  return entry;
}
