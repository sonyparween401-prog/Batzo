from pathlib import Path

ROOT = Path.home() / "Batzo"

APP = ROOT / "frontend/src/App.jsx"
LIVE = ROOT / "backend/live-fallback.js"
ROUTES = ROOT / "backend/cricket-routes.js"

app = APP.read_text()
live = LIVE.read_text()
routes = ROUTES.read_text()

# ============================================================
# 1. TEAM SYNC
# Use the same auth-refresh bridge already working for Wallet.
# Normalize player IDs, C/VC IDs and credits.
# ============================================================

start = app.find(
    "  async function syncTeamToBackend(match, contest, team) {"
)

end = app.find(
    "\n  function entryAmount(contest) {",
    start
)

if start < 0 or end < 0:
    raise SystemExit(
        "ERROR: syncTeamToBackend block not found"
    )

new_sync = r'''  async function syncTeamToBackend(match, contest, team) {
    try {
      if (team?.backendId) {
        return {
          ok: true,
          team: {
            id: team.backendId
          }
        };
      }

      const matchId = Number(
        contest?.matchId ||
        contest?.match_id ||
        match?.matchId ||
        match?.match_id ||
        match?.id ||
        1
      );

      if (!matchId) {
        return {
          ok: false,
          error: new Error("Match ID missing")
        };
      }

      const rawPlayers =
        Array.isArray(team?.players)
          ? team.players
          : [];

      const players =
        rawPlayers.map(function (p, index) {
          return {
            id: String(
              p?.id ??
              p?.playerId ??
              p?.name ??
              ("player-" + index)
            ),

            name:
              String(
                p?.name ||
                ("Player " + (index + 1))
              ),

            role:
              String(
                p?.role || ""
              )
                .trim()
                .toUpperCase(),

            team:
              String(
                p?.team || ""
              )
                .trim()
                .toUpperCase(),

            credits:
              Number(
                p?.credits ??
                p?.credit ??
                0
              )
          };
        });

      const captainId =
        String(
          team?.captainId ??
          team?.captain ??
          ""
        );

      const viceCaptainId =
        String(
          team?.viceCaptainId ??
          team?.viceCaptain ??
          ""
        );

      if (players.length !== 11) {
        throw new Error(
          "Exactly 11 players required"
        );
      }

      if (!captainId || !viceCaptainId) {
        throw new Error(
          "Captain and Vice-Captain are required"
        );
      }

      /*
       * batzoWalletRequest is actually our generic
       * authenticated backend request bridge:
       * it refreshes Firebase -> Batzo JWT on 401.
       */
      const data =
        await batzoWalletRequest(
          "/api/teams",
          {
            method: "POST",
            body: JSON.stringify({
              match_id: matchId,

              team_name:
                team?.name ||
                team?.team_name ||
                "Team",

              players,
              captainId,
              viceCaptainId
            })
          }
        );

      if (
        !data ||
        data.success !== true ||
        !data.team?.id
      ) {
        throw new Error(
          data?.message ||
          "Team sync failed"
        );
      }

      team.backendId =
        data.team.id;

      try {
        const refreshed =
          getTeams(match)
            .map(function (item) {
              return (
                String(item.id) ===
                String(team.id)
              )
                ? Object.assign(
                    {},
                    item,
                    {
                      backendId:
                        data.team.id
                    }
                  )
                : item;
            });

        saveTeams(
          match,
          refreshed
        );
      } catch (_) {}

      console.log(
        "BATZO BACKEND TEAM READY:",
        data.team.id
      );

      return {
        ok: true,
        team: data.team
      };

    } catch (error) {
      console.warn(
        "BATZO TEAM SYNC ERROR:",
        error
      );

      return {
        ok: false,
        error,
        data: error?.data || null
      };
    }
  }
'''

app = (
    app[:start] +
    new_sync +
    app[end:]
)

# Fix leftover undefined joinTeamId from previous patch.
app = app.replace(
    "teamId: joinTeamId",
    "teamId: team.backendId || team.id"
)

# Secondary helper should also prefer backend team ID.
old = '''        teamId: team.id
      })'''

new = '''        teamId:
          team.backendId || team.id
      })'''

app = app.replace(
    old,
    new,
    1
)

# Show actual backend sync error instead of generic message.
app = app.replace(
    '''        if (!team.backendId) {
          throw new Error(
            "Team could not be synced. Please try again."
          );
        }''',
    '''        if (!team.backendId) {
          throw new Error(
            synced?.data?.message ||
            synced?.error?.message ||
            "Team could not be synced. Please try again."
          );
        }''',
    1
)

APP.write_text(app)

print("✅ TEAM SYNC NORMALIZATION FIXED")
print("✅ FRESH JWT AUTH BRIDGE USED")
print("✅ JOIN BACKEND TEAM ID FIXED")

# ============================================================
# 2. ESPN REAL MATCH FALLBACK
# Existing file already contains ESPN live normalization.
# Add current + scheduled + result board fallback.
# ============================================================

marker = "BATZO_ESPN_MATCH_BOARD_FALLBACK_V1"

if marker not in live:

    export_pos = live.rfind(
        "module.exports = {"
    )

    if export_pos < 0:
        raise SystemExit(
            "ERROR: live-fallback export block missing"
        )

    addition = r'''
/* BATZO_ESPN_MATCH_BOARD_FALLBACK_V1 */

let batzoMatchBoardCache = {
  time: 0,
  data: []
};

let batzoMatchBoardPending = null;

function batzoDateKey(date) {
  const dd =
    String(
      date.getUTCDate()
    ).padStart(2, "0");

  const mm =
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0");

  const yyyy =
    date.getUTCFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

function normalizeEspnBoardMatch(m = {}) {
  const teams =
    Array.isArray(m?.teams)
      ? m.teams
          .slice(0, 2)
          .map(espnTeam)
      : [];

  const a =
    teams[0] || {
      name: "Team A",
      shortname: "A",
      img: "",
      scoreText: ""
    };

  const b =
    teams[1] || {
      name: "Team B",
      shortname: "B",
      img: "",
      scoreText: ""
    };

  const series =
    text(
      m?.series?.name,
      m?.series?.longName,
      m?.seriesName
    ) || "Cricket";

  const matchLine =
    text(
      m?.title,
      m?.longName,
      m?.name,
      m?.slug
    ) || "Cricket Match";

  const state =
    String(
      m?.state || ""
    ).toUpperCase();

  const stage =
    String(
      m?.stage || ""
    ).toUpperCase();

  const status =
    text(
      m?.statusText,
      m?.status,
      m?.state,
      m?.stage
    );

  const low =
    status.toLowerCase();

  const ended =
    state === "POST" ||
    stage === "FINISHED" ||
    stage === "COMPLETE" ||
    /\b(won|completed|complete|finished|drawn|abandoned|cancelled|canceled|no result)\b/
      .test(low);

  const started =
    !ended &&
    (
      state === "LIVE" ||
      stage === "RUNNING" ||
      /\b(live|innings break|lunch|tea|stumps|day \d)\b/
        .test(low)
    );

  const seriesId =
    m?.series?.objectId ||
    m?.series?.id ||
    "";

  const matchId =
    m?.objectId ||
    m?.id ||
    "";

  const scores = [];

  const scoreA =
    parseScore(
      a.scoreText,
      a.name
    );

  const scoreB =
    parseScore(
      b.scoreText,
      b.name
    );

  if (scoreA) scores.push(scoreA);
  if (scoreB) scores.push(scoreB);

  return {
    id:
      `espn:${seriesId}:${matchId}`,

    provider:
      "espncricinfo",

    providerMatchId:
      String(matchId),

    providerSeriesId:
      String(seriesId),

    name:
      `${a.name} vs ${b.name}, ${matchLine}, ${series}`,

    matchType:
      text(
        m?.format,
        m?.formatName
      ) || "cricket",

    status:
      status ||
      (
        ended
          ? "Completed"
          : started
            ? "LIVE"
            : "Upcoming"
      ),

    venue:
      text(
        m?.ground?.name,
        m?.ground?.smallName,
        m?.venue
      ),

    dateTimeGMT:
      text(
        m?.startTime,
        m?.startDate,
        m?.date
      ),

    teams:
      [
        a.name,
        b.name
      ],

    teamInfo:
      [
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

    score:
      scores,

    seriesName:
      series,

    matchStarted:
      started,

    matchEnded:
      ended,

    fallbackSource:
      "ESPN"
  };
}

async function fetchEspnBoard(url) {
  try {
    const response =
      await axios.get(
        url,
        {
          headers: {
            ...HEADERS,
            Origin:
              "https://www.espncricinfo.com",
            Referer:
              "https://www.espncricinfo.com/"
          },
          timeout: 15000
        }
      );

    const rows =
      Array.isArray(
        response?.data?.matches
      )
        ? response.data.matches
        : Array.isArray(
            response?.data?.content?.matches
          )
          ? response.data.content.matches
          : [];

    return rows;

  } catch (error) {
    console.warn(
      "ESPN MATCH BOARD:",
      error.response?.status ||
      error.message
    );

    return [];
  }
}

async function getFallbackMatches() {
  /*
   * Cache 15 minutes so the fallback does not
   * repeatedly hit ESPN for every Batzo user.
   */
  if (
    batzoMatchBoardCache.data.length &&
    Date.now() -
      batzoMatchBoardCache.time <
      15 * 60 * 1000
  ) {
    return batzoMatchBoardCache.data;
  }

  if (batzoMatchBoardPending) {
    return batzoMatchBoardPending;
  }

  batzoMatchBoardPending =
    (async () => {
      const urls = [
        "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true"
      ];

      const now =
        new Date();

      /*
       * Upcoming schedule:
       * today + next 7 days.
       */
      for (
        let offset = 0;
        offset <= 7;
        offset += 1
      ) {
        const date =
          new Date(
            now.getTime() +
            offset *
              24 *
              60 *
              60 *
              1000
          );

        urls.push(
          "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/scheduled?lang=en&filterType=DATE&filterValue=" +
          encodeURIComponent(
            batzoDateKey(date)
          )
        );
      }

      /*
       * Completed matches:
       * today + previous 3 days.
       */
      for (
        let offset = 0;
        offset <= 3;
        offset += 1
      ) {
        const date =
          new Date(
            now.getTime() -
            offset *
              24 *
              60 *
              60 *
              1000
          );

        urls.push(
          "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/result?lang=en&filterType=DATE&filterValue=" +
          encodeURIComponent(
            batzoDateKey(date)
          )
        );
      }

      const settled =
        await Promise.allSettled(
          urls.map(fetchEspnBoard)
        );

      const all = [];

      for (const item of settled) {
        if (
          item.status === "fulfilled" &&
          Array.isArray(item.value)
        ) {
          all.push(
            ...item.value
          );
        }
      }

      const out = [];
      const seen =
        new Set();

      for (const raw of all) {
        const match =
          normalizeEspnBoardMatch(
            raw
          );

        const key =
          match.id ||
          `${match.name}:${match.dateTimeGMT}`;

        if (
          !key ||
          seen.has(key)
        ) {
          continue;
        }

        seen.add(key);
        out.push(match);
      }

      batzoMatchBoardCache = {
        time: Date.now(),
        data: out
      };

      console.log(
        "BATZO ESPN FALLBACK MATCHES:",
        out.length
      );

      return out;
    })();

  try {
    return await batzoMatchBoardPending;
  } finally {
    batzoMatchBoardPending = null;
  }
}

'''

    live = (
        live[:export_pos] +
        addition +
        live[export_pos:]
    )

    live = live.replace(
        '''module.exports = {
  getFallbackLive
};''',
        '''module.exports = {
  getFallbackLive,
  getFallbackMatches
};''',
        1
    )

LIVE.write_text(live)

print("✅ ESPN SCHEDULE + RESULT FALLBACK ADDED")

# ============================================================
# 3. CRICKET ROUTES
# Merge CricketData + ESPN fallback.
# ============================================================

routes = routes.replace(
    '''const { getFallbackLive } = require("./live-fallback");''',
    '''const {
  getFallbackLive,
  getFallbackMatches
} = require("./live-fallback");''',
    1
)

matches_marker = (
    "BATZO_MATCHES_ESPN_FALLBACK_V1"
)

if matches_marker not in routes:

    anchor = '''    all = uniqueMatches(all);

    all.sort((a, b) => {'''

    replacement = '''    all = uniqueMatches(all);

    /* BATZO_MATCHES_ESPN_FALLBACK_V1 */
    try {
      const fallback =
        await getFallbackMatches();

      all =
        uniqueMatches([
          ...all,
          ...fallback
        ]);

    } catch (error) {
      console.warn(
        "MATCHES FALLBACK:",
        error.message
      );
    }

    all.sort((a, b) => {'''

    if anchor not in routes:
        raise SystemExit(
            "ERROR: /matches fallback anchor missing"
        )

    routes = routes.replace(
        anchor,
        replacement,
        1
    )

upcoming_marker = (
    "BATZO_UPCOMING_ESPN_FALLBACK_V1"
)

if upcoming_marker not in routes:

    anchor = '''    const upcoming = uniqueMatches(all)
      .filter(isUpcomingMatch)'''

    replacement = '''    /* BATZO_UPCOMING_ESPN_FALLBACK_V1 */
    try {
      const fallback =
        await getFallbackMatches();

      all =
        uniqueMatches([
          ...all,
          ...fallback
        ]);

    } catch (error) {
      console.warn(
        "UPCOMING FALLBACK:",
        error.message
      );
    }

    const upcoming = uniqueMatches(all)
      .filter(isUpcomingMatch)'''

    if anchor not in routes:
        raise SystemExit(
            "ERROR: /upcoming fallback anchor missing"
        )

    routes = routes.replace(
        anchor,
        replacement,
        1
    )

ROUTES.write_text(routes)

print("✅ /matches ESPN FALLBACK ENABLED")
print("✅ /upcoming ESPN FALLBACK ENABLED")
print("✅ EXISTING /live FALLBACK PRESERVED")
