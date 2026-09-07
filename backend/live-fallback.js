const axios = require("axios");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9"
};

function text(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseScore(value, teamName) {
  const raw =
    typeof value === "string"
      ? value
      : text(
          value?.display,
          value?.score,
          value?.value,
          value?.text
        );

  if (!raw) return null;

  const matches = [
    ...raw.matchAll(/(\d+)(?:\/(\d+))?/g)
  ];

  if (!matches.length) return null;

  const m = matches[matches.length - 1];

  const overMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*(?:ov|overs)/i
  );

  return {
    r: Number(m[1] || 0),
    w: m[2] != null ? Number(m[2]) : 0,
    o: overMatch ? Number(overMatch[1]) : undefined,
    inning: `${teamName || "Team"} Inning`
  };
}

function espnTeam(row = {}) {
  const team = row?.team || {};

  return {
    name: text(
      team?.name,
      team?.longName,
      team?.displayName
    ) || "Team",
    shortname: text(
      team?.abbreviation,
      team?.shortName,
      team?.name
    ).toUpperCase().slice(0, 5),
    img: text(
      team?.imageUrl,
      team?.logo,
      team?.flagUrl
    ),
    scoreText:
      typeof row?.score === "string"
        ? row.score
        : text(
            row?.score?.display,
            row?.scoreInfo,
            row?.scoreText
          )
  };
}

async function fetchEspnLive() {
  const urls = [
    "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/live?lang=en",
    "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true"
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: 12000
      });

      const rows = Array.isArray(response?.data?.matches)
        ? response.data.matches
        : [];

      const live = rows.filter((m) => {
        const state = String(m?.state || "").toUpperCase();
        const stage = String(m?.stage || "").toUpperCase();
        const status = String(m?.status || "").toLowerCase();

        return (
          state === "LIVE" ||
          stage === "RUNNING" ||
          /\b(live|innings break|lunch|tea|stumps|day \d)\b/.test(
            status
          )
        );
      });

      if (!live.length) continue;

      return live.map((m) => {
        const teams = Array.isArray(m?.teams)
          ? m.teams.slice(0, 2).map(espnTeam)
          : [];

        const a = teams[0] || {
          name: "Team A",
          shortname: "A",
          scoreText: ""
        };

        const b = teams[1] || {
          name: "Team B",
          shortname: "B",
          scoreText: ""
        };

        const series =
          text(
            m?.series?.name,
            m?.series?.longName
          ) || "Cricket";

        const matchLine =
          text(
            m?.title,
            m?.longName,
            m?.name
          ) || "Live Match";

        const seriesId =
          m?.series?.objectId ||
          m?.series?.id ||
          "";

        const matchId =
          m?.objectId ||
          m?.id ||
          "";

        const scores = [];

        const as = parseScore(a.scoreText, a.name);
        const bs = parseScore(b.scoreText, b.name);

        if (as) scores.push(as);
        if (bs) scores.push(bs);

        return {
          id: `espn:${seriesId}:${matchId}`,
          provider: "espncricinfo",
          providerMatchId: String(matchId),
          providerSeriesId: String(seriesId),

          name: `${a.name} vs ${b.name}, ${matchLine}, ${series}`,

          matchType:
            text(m?.format, m?.formatName) ||
            "cricket",

          status:
            text(
              m?.statusText,
              m?.status,
              m?.state
            ) || "LIVE",

          venue:
            text(
              m?.ground?.name,
              m?.ground?.smallName,
              m?.venue
            ),

          dateTimeGMT:
            text(
              m?.startTime,
              m?.startDate
            ),

          teams: [a.name, b.name],

          teamInfo: [
            {
              name: a.name,
              shortname: a.shortname,
              img: a.img
            },
            {
              name: b.name,
              shortname: b.shortname,
              img: b.img
            }
          ],

          score: scores,

          seriesName: series,
          matchStarted: true,
          matchEnded: false,
          liveSource: "ESPN"
        };
      });
    } catch (error) {
      console.warn(
        "ESPN LIVE FALLBACK:",
        error.response?.status || error.message
      );
    }
  }

  return [];
}

async function fetchCricbuzzLive() {
  try {
    const response = await axios.get(
      "https://www.cricbuzz.com/match-api/livematches.json",
      {
        headers: HEADERS,
        timeout: 12000
      }
    );

    const matches = response?.data?.matches;

    if (!matches || typeof matches !== "object") {
      return [];
    }

    const out = [];

    for (const [id, m] of Object.entries(matches)) {
      const status = text(
        m?.status,
        m?.header?.status,
        m?.header?.state
      );

      const low = status.toLowerCase();

      if (
        /\b(won|complete|completed|abandoned|cancelled|canceled|no result)\b/.test(
          low
        )
      ) {
        continue;
      }

      const aName =
        text(
          m?.team1?.name,
          m?.team1?.s_name
        ) || "Team A";

      const bName =
        text(
          m?.team2?.name,
          m?.team2?.s_name
        ) || "Team B";

      const series =
        text(
          m?.series?.name,
          m?.series_name
        ) || "Cricket";

      const scoreA = parseScore(
        text(
          m?.score?.team1?.score,
          m?.score?.batting?.score
        ),
        aName
      );

      const scoreB = parseScore(
        text(
          m?.score?.team2?.score,
          m?.score?.bowling?.score
        ),
        bName
      );

      const scores = [];

      if (scoreA) scores.push(scoreA);
      if (scoreB) scores.push(scoreB);

      out.push({
        id: `cricbuzz:${id}`,
        provider: "cricbuzz",
        providerMatchId: String(id),

        name:
          `${aName} vs ${bName}, Live Match, ${series}`,

        matchType:
          text(m?.type, m?.match_type) ||
          "cricket",

        status: status || "LIVE",

        venue:
          text(
            m?.venue?.name,
            m?.venue
          ),

        teams: [aName, bName],

        teamInfo: [
          {
            name: aName,
            shortname:
              text(
                m?.team1?.s_name,
                aName
              ).toUpperCase().slice(0, 5),
            img: ""
          },
          {
            name: bName,
            shortname:
              text(
                m?.team2?.s_name,
                bName
              ).toUpperCase().slice(0, 5),
            img: ""
          }
        ],

        score: scores,
        seriesName: series,
        matchStarted: true,
        matchEnded: false,
        liveSource: "CRICBUZZ"
      });
    }

    return out;
  } catch (error) {
    console.warn(
      "CRICBUZZ LIVE FALLBACK:",
      error.response?.status || error.message
    );

    return [];
  }
}

async function getFallbackLive() {
  const espn = await fetchEspnLive();

  if (espn.length) {
    return espn;
  }

  return fetchCricbuzzLive();
}

module.exports = {
  getFallbackLive
};
