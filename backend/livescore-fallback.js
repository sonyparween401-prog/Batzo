const axios = require("axios");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",
  Accept: "application/json",
  Origin: "https://www.livescore.com",
  Referer: "https://www.livescore.com/"
};

let cache = {
  time: 0,
  data: []
};

let pending = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateParts(date) {
  return {
    dd: pad(date.getUTCDate()),
    mm: pad(date.getUTCMonth() + 1),
    yyyy: String(date.getUTCFullYear())
  };
}

function shortName(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "TEAM";

  if (words.length === 1) {
    return words[0]
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase();
  }

  return words
    .map(x => x[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function parseStart(ev, fallbackDate) {
  const raw = String(
    ev?.Esd ||
    ev?.Epsd ||
    ev?.startTime ||
    ""
  ).trim();

  const m = raw.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/
  );

  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]) - 1;
    const dd = Number(m[3]);
    const hh = Number(m[4] || 0);
    const mi = Number(m[5] || 0);
    const ss = Number(m[6] || 0);

    return new Date(
      Date.UTC(
        yyyy,
        mm,
        dd,
        hh,
        mi,
        ss
      )
    ).toISOString();
  }

  const p = dateParts(fallbackDate);

  return (
    p.yyyy +
    "-" +
    p.mm +
    "-" +
    p.dd +
    "T12:00:00Z"
  );
}

function parseScore(raw, teamName) {
  const text = String(
    raw == null ? "" : raw
  ).trim();

  if (!text) return null;

  const m = text.match(
    /(\d+)(?:\/(\d+))?/
  );

  if (!m) return null;

  return {
    r: Number(m[1] || 0),
    w: m[2] == null
      ? 0
      : Number(m[2]),
    inning:
      String(teamName || "Team") +
      " Inning"
  };
}

function normalizeEvent(ev, stage, boardDate) {
  const home =
    String(
      ev?.T1?.[0]?.Nm ||
      "Team A"
    ).trim();

  const away =
    String(
      ev?.T2?.[0]?.Nm ||
      "Team B"
    ).trim();

  const series =
    String(
      stage?.Snm ||
      stage?.Cnm ||
      "Cricket"
    ).trim();

  const eps =
    String(
      ev?.Eps ||
      ""
    ).trim();

  const esid =
    Number(
      ev?.Esid
    );

  const start =
    parseStart(
      ev,
      boardDate
    );

  const startMs =
    Date.parse(start);

  const low =
    eps.toLowerCase();

  const ended =
    esid === 3 ||
    /\b(ft|finished|complete|completed|won|drawn|abandoned|cancelled|canceled|no result)\b/
      .test(low);

  const notStarted =
    esid === 1 ||
    /\b(ns|not started|scheduled|upcoming)\b/
      .test(low);

  const future =
    Number.isFinite(startMs) &&
    startMs >
      Date.now() +
      5 * 60 * 1000;

  const hasScore =
    ev?.Tr1 != null ||
    ev?.Tr2 != null;

  const started =
    !ended &&
    !future &&
    !notStarted &&
    (
      hasScore ||
      /\b(live|innings|over|break|stumps|lunch|tea)\b/
        .test(low)
    );

  const score = [];

  const aScore =
    parseScore(
      ev?.Tr1,
      home
    );

  const bScore =
    parseScore(
      ev?.Tr2,
      away
    );

  if (aScore) score.push(aScore);
  if (bScore) score.push(bScore);

  const id =
    ev?.Eid ||
    ev?.ID ||
    (
      home +
      "-" +
      away +
      "-" +
      start
    );

  return {
    id:
      "livescore:" +
      String(id),

    provider:
      "livescore",

    name:
      home +
      " vs " +
      away +
      ", " +
      series,

    matchType:
      "cricket",

    status:
      eps ||
      (
        ended
          ? "Completed"
          : started
            ? "LIVE"
            : "Upcoming"
      ),

    venue: "",

    dateTimeGMT:
      start,

    teams: [
      home,
      away
    ],

    teamInfo: [
      {
        name: home,
        shortname:
          shortName(home),
        img: ""
      },
      {
        name: away,
        shortname:
          shortName(away),
        img: ""
      }
    ],

    score,

    seriesName:
      series,

    matchStarted:
      started,

    matchEnded:
      ended,

    fallbackSource:
      "LIVESCORE"
  };
}

async function fetchBoard(date) {
  const {
    dd,
    mm,
    yyyy
  } = dateParts(date);

  const url =
    "https://prod-public-api.livescore.com/v1/api/app/date/cricket/" +
    dd +
    "/" +
    mm +
    "/" +
    yyyy +
    "/0";

  try {
    const response =
      await axios.get(
        url,
        {
          headers: HEADERS,
          timeout: 15000
        }
      );

    const stages =
      Array.isArray(
        response?.data?.Stages
      )
        ? response.data.Stages
        : [];

    const out = [];

    for (const stage of stages) {
      const events =
        Array.isArray(
          stage?.Events
        )
          ? stage.Events
          : [];

      for (const event of events) {
        out.push(
          normalizeEvent(
            event,
            stage,
            date
          )
        );
      }
    }

    return out;

  } catch (error) {
    console.warn(
      "LIVESCORE BOARD:",
      dd + "/" + mm + "/" + yyyy,
      error.response?.status ||
      error.message
    );

    return [];
  }
}

async function getLiveScoreMatches() {
  if (
    cache.data.length &&
    Date.now() -
      cache.time <
      10 * 60 * 1000
  ) {
    return cache.data;
  }

  if (pending) {
    return pending;
  }

  pending =
    (async () => {
      const now =
        new Date();

      const dates = [];

      /*
       * Previous 3 days:
       * completed matches.
       *
       * Today + next 14 days:
       * live/upcoming matches.
       */
      for (
        let offset = -3;
        offset <= 14;
        offset += 1
      ) {
        dates.push(
          new Date(
            now.getTime() +
            offset *
              24 *
              60 *
              60 *
              1000
          )
        );
      }

      const settled =
        await Promise.allSettled(
          dates.map(
            fetchBoard
          )
        );

      const out = [];
      const seen =
        new Set();

      for (const item of settled) {
        if (
          item.status !==
          "fulfilled"
        ) {
          continue;
        }

        for (
          const match of
          item.value
        ) {
          if (
            !match?.id ||
            seen.has(match.id)
          ) {
            continue;
          }

          seen.add(match.id);
          out.push(match);
        }
      }

      cache = {
        time: Date.now(),
        data: out
      };

      console.log(
        "BATZO LIVESCORE FALLBACK:",
        out.length
      );

      return out;
    })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

module.exports = {
  getLiveScoreMatches
};
