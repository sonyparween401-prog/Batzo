export function getMatchDate(match) {
  const raw =
    match?.dateTimeGMT ??
    match?.dateTime ??
    match?.date ??
    null;

  if (!raw) return null;

  const value = String(raw).trim();

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00Z`
      : value
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export function isUpcomingMatch(match) {
  if (!match) return false;
  if (match.matchEnded === true) return false;
  if (match.matchStarted === true) return false;

  const date=getMatchDate(match);

  return !!date && date.getTime() > Date.now();
}

export function filterUpcomingMatches(matches) {
  if (!Array.isArray(matches)) return [];

  return matches
    .filter(isUpcomingMatch)
    .sort((a,b) => {
      const da=getMatchDate(a)?.getTime() ?? Infinity;
      const db=getMatchDate(b)?.getTime() ?? Infinity;
      return da-db;
    });
}
