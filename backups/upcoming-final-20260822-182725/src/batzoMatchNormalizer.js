export function batzoMatchDate(m) {
  const v = m?.dateTimeGMT || m?.dateTime || m?.startTime || m?.date;
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function batzoMatchCategory(m) {
  const status = String(
    m?.status || m?.state || m?.matchStatus || ""
  ).toLowerCase();

  if (
    m?.matchEnded === true ||
    /won by|draw|tied|abandoned|no result|completed|finished/.test(status)
  ) return "completed";

  if (
    m?.matchStarted === true ||
    /live|in progress|stumps|innings break/.test(status)
  ) return "live";

  const d = batzoMatchDate(m);
  if (d && d.getTime() <= Date.now()) return "live";

  return "upcoming";
}

export function batzoExtractMatches(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.matches,
    payload?.data?.matches,
    payload?.data?.matchList
  ];

  for (const x of candidates) {
    if (Array.isArray(x)) return x;
  }

  return [];
}

export function batzoNormalizeMatches(payloads) {
  const map = new Map();

  for (const payload of payloads) {
    for (const m of batzoExtractMatches(payload)) {
      const key =
        m?.id ||
        `${m?.name || ""}-${m?.dateTimeGMT || m?.date || ""}`;

      if (key) map.set(key, m);
    }
  }

  return [...map.values()];
}
