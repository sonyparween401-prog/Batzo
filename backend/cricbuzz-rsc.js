const axios = require("axios");

const BASE = "https://www.cricbuzz.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${BASE}/`
};

const boardCache = {
  time: 0,
  data: null,
  pending: null
};

const detailCache = new Map();

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeRsc(html) {
  const source = String(html || "");
  const regex =
    /<script>self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g;

  let text = "";
  let match;

  while ((match = regex.exec(source))) {
    try {
      const chunk = JSON.parse(match[1]);
      if (typeof chunk?.[1] === "string") {
        text += chunk[1];
      }
    } catch (_) {}
  }

  return text;
}

function extractJsonAt(text, start) {
  let cursor = text.indexOf(":", start);
  if (cursor < 0) return null;

  cursor += 1;
  while (/\s/.test(text[cursor] || "")) cursor += 1;

  const open = text[cursor];
  const close = open === "{" ? "}" : open === "[" ? "]" : "";
  if (!close) return null;

  let depth = 0;
  let quoted = false;
  let escaped = false;

  for (let i = cursor; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        quoted = false;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === open) depth += 1;

    if (char === close) {
      depth -= 1;
      if (depth === 0) {
        try {
          return {
            value: JSON.parse(text.slice(cursor, i + 1)),
            end: i + 1
          };
        } catch (_) {
          return null;
        }
      }
    }
  }

  return null;
}

function extractJsonValues(text, key) {
  const needle = `"${key}"`;
  const values = [];
  let cursor = 0;

  while ((cursor = text.indexOf(needle, cursor)) >= 0) {
    const found = extractJsonAt(text, cursor);
    if (found) {
      values.push(found.value);
      cursor = found.end;
    } else {
      cursor += needle.length;
    }
  }

  return values;
}

function imageUrl(imageId, size = "72x54") {
  const id = Number(imageId);
  return Number.isFinite(id) && id > 0
    ? `https://static.cricbuzz.com/a/img/v1/${size}/i1/c${id}/i.jpg`
    : "";
}

function isoFromMillis(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";

  const millis = number > 100000000000 ? number : number * 1000;
  const date = new Date(millis);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function inningsRows(scoreRoot, teamName) {
  if (!scoreRoot || typeof scoreRoot !== "object") return [];

  return Object.values(scoreRoot)
    .filter((row) => row && typeof row === "object" && row.runs != null)
    .sort((a, b) => Number(a.inningsId || 0) - Number(b.inningsId || 0))
    .map((row) => ({
      r: Number(row.runs || 0),
      w: Number(row.wickets || 0),
      o: row.overs == null ? undefined : Number(row.overs),
      inning: `${teamName} Inning`,
      inningsId: Number(row.inningsId || 0)
    }));
}

function compactTeamScore(rows, teamName) {
  if (!rows.length) return null;

  const latest = rows[rows.length - 1];
  const display = rows
    .map((row) => {
      const main = `${row.r}/${row.w}`;
      return row.o == null ? main : `${main} (${row.o})`;
    })
    .join(" & ");

  return {
    ...latest,
    inning: `${teamName} Inning`,
    display,
    innings: rows
  };
}

function stateFlags(info, score) {
  const state = clean(info?.state || info?.stateTitle).toLowerCase();
  const status = clean(info?.status).toLowerCase();
  const text = `${state} ${status}`;

  const ended =
    /\b(complete|completed|result|won|drawn|abandoned|cancelled|canceled|no result)\b/.test(
      text
    );

  const started =
    ended ||
    score.length > 0 ||
    /\b(in progress|inprogress|innings break|lunch|tea|stumps|live)\b/.test(
      text
    );

  return {
    ended,
    started,
    live: started && !ended
  };
}

function normalizeMatch(info = {}, matchScore = {}) {
  const team1 = info.team1 || {};
  const team2 = info.team2 || {};

  const name1 = clean(team1.teamName || team1.name) || "Team A";
  const name2 = clean(team2.teamName || team2.name) || "Team B";
  const short1 = clean(team1.teamSName || team1.shortName || name1)
    .toUpperCase()
    .slice(0, 7);
  const short2 = clean(team2.teamSName || team2.shortName || name2)
    .toUpperCase()
    .slice(0, 7);

  const rows1 = inningsRows(matchScore?.team1Score, name1);
  const rows2 = inningsRows(matchScore?.team2Score, name2);
  const teamScore1 = compactTeamScore(rows1, name1);
  const teamScore2 = compactTeamScore(rows2, name2);
  const score = [teamScore1, teamScore2].filter(Boolean);
  const flags = stateFlags(info, score);

  const id = String(info.matchId || "");
  const desc = clean(info.matchDesc || info.matchDescription || "Match");
  const series = clean(info.seriesName || info.seriesDesc || "Cricket");
  const venueInfo = info.venueInfo || info.venue || {};
  const venue = [venueInfo.ground, venueInfo.city]
    .map(clean)
    .filter(Boolean)
    .join(", ");

  return {
    id: `cricbuzz-web:${id}`,
    provider: "cricbuzz-web",
    providerMatchId: id,
    providerUrl: `${BASE}/live-cricket-scores/${id}/x`,
    name: `${name1} vs ${name2}, ${desc}, ${series}`,
    matchType: clean(info.matchFormat || info.matchType || "cricket"),
    status: clean(info.status || info.state || (flags.live ? "LIVE" : flags.ended ? "Completed" : "Upcoming")),
    venue,
    dateTimeGMT: isoFromMillis(
      info.startDate || info.matchStartTimestamp || info.startTime
    ),
    teams: [name1, name2],
    teamInfo: [
      {
        id: team1.teamId || team1.id || "",
        name: name1,
        shortname: short1,
        img: imageUrl(team1.imageId)
      },
      {
        id: team2.teamId || team2.id || "",
        name: name2,
        shortname: short2,
        img: imageUrl(team2.imageId)
      }
    ],
    score,
    seriesName: series,
    category: clean(info.matchType || ""),
    matchStarted: flags.started,
    matchEnded: flags.ended,
    webSource: "CRICBUZZ_RSC"
  };
}

function boardRows(typeMatches) {
  const rows = [];

  for (const type of Array.isArray(typeMatches) ? typeMatches : []) {
    for (const seriesRow of Array.isArray(type?.seriesMatches)
      ? type.seriesMatches
      : []) {
      const wrapper = seriesRow?.seriesAdWrapper || seriesRow;

      for (const row of Array.isArray(wrapper?.matches)
        ? wrapper.matches
        : []) {
        const info = row?.matchInfo || row?.match?.matchInfo;
        const score = row?.matchScore || row?.match?.matchScore || {};

        if (!info?.matchId) continue;

        rows.push(
          normalizeMatch(
            {
              ...info,
              matchType: info.matchType || type?.matchType,
              seriesName: info.seriesName || wrapper?.seriesName
            },
            score
          )
        );
      }
    }
  }

  return rows;
}

function uniqueMatches(list) {
  const output = [];
  const seen = new Set();

  for (const match of list) {
    const id = String(match?.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(match);
  }

  return output;
}

function parseBoardHtml(html) {
  const rsc = decodeRsc(html);
  const candidates = extractJsonValues(rsc, "typeMatches");

  let best = [];
  for (const candidate of candidates) {
    const rows = boardRows(candidate);
    if (rows.length > best.length) best = rows;
  }

  const all = uniqueMatches(best);
  const live = all.filter((match) => match.matchStarted && !match.matchEnded);
  const upcoming = all.filter(
    (match) => !match.matchStarted && !match.matchEnded
  );
  const recent = all.filter((match) => match.matchEnded);

  if (!all.length) {
    throw new Error("Cricbuzz match board was empty");
  }

  return { live, upcoming, recent, all };
}

async function fetchHtml(url, timeout = 12000) {
  const response = await axios.get(url, {
    headers: HEADERS,
    timeout,
    maxRedirects: 5,
    responseType: "text"
  });

  return String(response.data || "");
}

async function refreshBoard() {
  const html = await fetchHtml(`${BASE}/cricket-match/live-scores`);
  const data = parseBoardHtml(html);

  boardCache.data = data;
  boardCache.time = Date.now();

  console.log(
    "BATZO CRICBUZZ RSC:",
    `LIVE=${data.live.length}`,
    `UPCOMING=${data.upcoming.length}`,
    `RECENT=${data.recent.length}`
  );

  return data;
}

async function getCricbuzzWebData() {
  if (boardCache.data && Date.now() - boardCache.time < 30 * 1000) {
    return boardCache.data;
  }

  if (boardCache.pending) return boardCache.pending;

  boardCache.pending = refreshBoard();

  try {
    return await boardCache.pending;
  } catch (error) {
    if (boardCache.data) {
      console.warn("BATZO CRICBUZZ RSC stale cache:", error.message);
      return boardCache.data;
    }
    throw error;
  } finally {
    boardCache.pending = null;
  }
}

function numericMatchId(value) {
  const match = String(value || "").match(/(\d+)(?!.*\d)/);
  return match ? match[1] : "";
}

function playerRole(player = {}) {
  const role = clean(player.role).toLowerCase();

  if (player.keeper || /\b(wk|wicket.?keeper|keeper)\b/.test(role)) {
    return "WK";
  }
  if (/all.?round/.test(role)) return "AR";
  if (/bowl/.test(role)) return "BOWL";
  return "BAT";
}

function normalizePlayers(info = {}) {
  const teams = [info.team1, info.team2].filter(Boolean);
  const output = [];
  const seen = new Set();

  for (const team of teams) {
    const teamName = clean(team.name || team.teamName) || "Team";
    const teamCode = clean(
      team.shortName || team.teamSName || teamName
    )
      .toUpperCase()
      .slice(0, 7);

    for (const player of Array.isArray(team.playerDetails)
      ? team.playerDetails
      : []) {
      const name = clean(player.name || player.fullName || player.nickName);
      const id = String(player.id || `${teamCode}:${name}`);

      if (!name || seen.has(id)) continue;
      seen.add(id);

      output.push({
        id,
        name,
        role: playerRole(player),
        team: teamCode,
        teamName,
        credit: 8.5,
        captain: !!player.captain,
        keeper: !!player.keeper,
        substitute: !!player.substitute,
        image: imageUrl(player.faceImageId, "152x152")
      });
    }
  }

  return output;
}

function commentaryBalls(commentary = {}) {
  return Object.values(commentary)
    .filter(
      (row) =>
        row &&
        typeof row === "object" &&
        Number.isFinite(Number(row.ballMetric))
    )
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))
    .map((row) => {
      const metric = Number(row.ballMetric);
      const over = Math.floor(metric);
      const ball = Math.round((metric - over) * 10);
      const event = Array.isArray(row.event)
        ? row.event.map((item) => clean(item).toLowerCase())
        : [];
      const commentaryText = clean(row.commText);

      let runs = 0;
      if (event.includes("six") || /\b6 runs?\b/i.test(commentaryText)) {
        runs = 6;
      } else if (
        event.includes("four") ||
        /\bfour\b/i.test(commentaryText)
      ) {
        runs = 4;
      } else {
        const runMatch = commentaryText.match(/,\s*(\d+)\s+runs?\b/i);
        runs = runMatch ? Number(runMatch[1]) : 0;
      }

      const wicket =
        event.includes("wicket") ||
        /,\s*(?:out|wicket)\b/i.test(commentaryText);
      const extraType = event.includes("wide")
        ? "wide"
        : event.includes("noball") || event.includes("no-ball")
          ? "no ball"
          : /,\s*wides?\b/i.test(commentaryText)
            ? "wide"
            : /\bno.?ball\b/i.test(commentaryText)
              ? "no ball"
              : "";

      return {
        inning: Number(row.inningsId || 0),
        over,
        ball,
        runs,
        wicket,
        isWicket: wicket,
        extraType,
        text: commentaryText,
        batsman: {
          id: row?.batsmanDetails?.playerId || "",
          name: clean(row?.batsmanDetails?.playerName)
        },
        bowler: {
          id: row?.bowlerDetails?.playerId || "",
          name: clean(row?.bowlerDetails?.playerName)
        },
        timestamp: Number(row.timestamp || 0)
      };
    });
}

function detailFromHtml(html, expectedId) {
  const rsc = decodeRsc(html);
  const pageData =
    extractJsonValues(rsc, "commentaryPageData")
      .sort(
        (a, b) =>
          Object.keys(b?.matchCommentary || {}).length -
          Object.keys(a?.matchCommentary || {}).length
      )[0] || {};

  const fullInfos = extractJsonValues(rsc, "matchInfo").filter(
    (info) => String(info?.matchId || "") === String(expectedId)
  );

  const fullInfo =
    fullInfos.find(
      (info) =>
        (Array.isArray(info?.team1?.playerDetails) &&
          info.team1.playerDetails.length) ||
        (Array.isArray(info?.team2?.playerDetails) &&
          info.team2.playerDetails.length)
    ) || fullInfos[fullInfos.length - 1] || {};

  const header = pageData?.matchHeader || {};
  const mini = pageData?.miniscore || {};

  const scoreRows = Array.isArray(mini?.matchScoreDetails?.inningsScoreList)
    ? mini.matchScoreDetails.inningsScoreList
    : [];

  const team1Id = String(
    fullInfo?.team1?.id ||
      fullInfo?.team1?.teamId ||
      header?.team1?.id ||
      ""
  );
  const team2Id = String(
    fullInfo?.team2?.id ||
      fullInfo?.team2?.teamId ||
      header?.team2?.id ||
      ""
  );

  const toScoreRoot = (teamId) => {
    const root = {};
    scoreRows
      .filter((row) => String(row?.batTeamId || "") === teamId)
      .forEach((row, index) => {
        root[`inngs${index + 1}`] = {
          inningsId: row.inningsId,
          runs: row.score,
          wickets: row.wickets,
          overs: row.overs
        };
      });
    return root;
  };

  const fallbackScore = extractJsonValues(rsc, "matchScore")[0] || {};
  const detailScore = scoreRows.length
    ? {
        team1Score: toScoreRoot(team1Id),
        team2Score: toScoreRoot(team2Id)
      }
    : fallbackScore;

  const normalizedInfo = {
    ...fullInfo,
    matchId: expectedId,
    matchDesc:
      fullInfo.matchDesc ||
      fullInfo.matchDescription ||
      header.matchDescription,
    matchFormat: fullInfo.matchFormat || header.matchFormat,
    startDate:
      fullInfo.startDate ||
      fullInfo.matchStartTimestamp ||
      header.matchStartTimestamp,
    state: fullInfo.state || header.state,
    status: fullInfo.status || header.status || mini.status,
    seriesName:
      fullInfo.seriesName || header.seriesName || header.seriesDesc,
    team1: fullInfo.team1 || header.team1,
    team2: fullInfo.team2 || header.team2
  };

  const match = normalizeMatch(normalizedInfo, detailScore);
  const balls = commentaryBalls(pageData?.matchCommentary || {});
  const players = normalizePlayers(fullInfo);

  const batters = [mini?.batsmanStriker, mini?.batsmanNonStriker]
    .filter((row) => row?.name)
    .map((row) => ({
      name: clean(row.name),
      runs: Number(row.runs || 0),
      balls: Number(row.balls || 0),
      fours: Number(row.fours || 0),
      sixes: Number(row.sixes || 0),
      strikeRate: clean(row.strikeRate || "0"),
      status: "not out"
    }));

  const bowlers = [mini?.bowlerStriker, mini?.bowlerNonStriker]
    .filter((row) => row?.name)
    .map((row) => ({
      name: clean(row.name),
      overs: row.overs == null ? "-" : String(row.overs),
      maidens: Number(row.maidens || 0),
      runs: Number(row.runs || 0),
      wickets: Number(row.wickets || 0),
      economy: row.economy == null ? "-" : String(row.economy)
    }));

  const battingScore = mini?.batTeam
    ? `${Number(mini.batTeam.teamScore || 0)}/${Number(
        mini.batTeam.teamWkts || 0
      )}`
    : "";

  return {
    match: {
      ...match,
      innings: {
        score: battingScore,
        overs: mini?.overs == null ? "" : String(mini.overs),
        runRate:
          mini?.currentRunRate == null
            ? ""
            : String(mini.currentRunRate),
        target: mini?.target == null ? "" : String(mini.target),
        need: clean(mini?.status || match.status)
      },
      batsmen: batters,
      bowlers,
      recentBalls: balls.slice(-6).map((ball) =>
        ball.wicket
          ? "W"
          : ball.extraType === "wide"
            ? "WD"
            : ball.extraType === "no ball"
              ? "NB"
              : String(ball.runs)
      ),
      lastUpdated: isoFromMillis(
        Number(pageData?.responseLastUpdated || 0) * 1000
      )
    },
    balls,
    players,
    responseLastUpdated: pageData?.responseLastUpdated || 0
  };
}

async function getCricbuzzMatchDetail(value) {
  const id = numericMatchId(value);
  if (!id) throw new Error("Valid Cricbuzz match id is required");

  const existing = detailCache.get(id);
  if (existing && Date.now() - existing.time < 15 * 1000) {
    return existing.data;
  }

  if (existing?.pending) return existing.pending;

  const pending = (async () => {
    const html = await fetchHtml(`${BASE}/live-cricket-scores/${id}/x`);
    const data = detailFromHtml(html, id);

    detailCache.set(id, {
      time: Date.now(),
      data
    });

    return data;
  })();

  detailCache.set(id, {
    time: existing?.time || 0,
    data: existing?.data || null,
    pending
  });

  try {
    return await pending;
  } catch (error) {
    detailCache.delete(id);
    if (existing?.data) return existing.data;
    throw error;
  }
}

module.exports = {
  decodeRsc,
  detailFromHtml,
  getCricbuzzMatchDetail,
  getCricbuzzWebData,
  normalizeMatch,
  parseBoardHtml
};
