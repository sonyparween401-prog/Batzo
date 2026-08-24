export function getMatchDate(match) {
  const raw =
    match?.dateTimeGMT ||
    match?.dateTime ||
    match?.date ||
    "";

  if (!raw) return null;

  const value = String(raw).trim();

  try {
    const date = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00Z`
        : value
    );

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function isUpcomingMatch(match) {
  if (!match || typeof match !== "object") return false;

  if (match.matchEnded === true) return false;
  if (match.matchStarted === true) return false;

  const matchDate = getMatchDate(match);

  if (!matchDate) return false;

  return matchDate.getTime() > Date.now();
}

export function isLiveMatch(match) {
  return !!(
    match &&
    match.matchStarted === true &&
    match.matchEnded !== true
  );
}

export function isCompletedMatch(match) {
  return !!(
    match &&
    match.matchEnded === true
  );
}

export function filterUpcomingMatches(matches) {
  if (!Array.isArray(matches)) return [];

  return matches
    .filter(isUpcomingMatch)
    .sort((a, b) => {
      const da = getMatchDate(a)?.getTime() ?? Infinity;
      const db = getMatchDate(b)?.getTime() ?? Infinity;
      return da - db;
    });
}
