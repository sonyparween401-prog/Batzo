from pathlib import Path
import re

ROOT = Path.home() / "Batzo"
APP = ROOT / "frontend/src/App.jsx"

s = APP.read_text()
original = s

def ok(msg):
    print("✅", msg)

# ============================================================
# 1. CONTINUE WITH SELECTED TEAM
# Auto-use selected team, or first saved team.
# Sync team first, then open Join Contest.
# ============================================================

team_start = s.find(
    "  function showMyTeams(match, contest) {"
)

team_end = s.find(
    "  function showTeamBuilder(",
    team_start
)

if team_start < 0 or team_end < 0:
    raise SystemExit(
        "ERROR: showMyTeams block not found"
    )

team_block = s[team_start:team_end]

continue_pat = re.compile(
    r'''(?P<decl>
        (?:const|let)\s+
        (?P<var>[A-Za-z_$][\w$]*)\s*=\s*
        (?P<root>[A-Za-z_$][\w$]*)\.querySelector\(
          \s*["']#bzContinueSelected["']\s*
        \)\s*;
    )
    \s*
    (?:if\s*\(\s*(?P=var)\s*\)\s*\{\s*)?
    (?P=var)\.onclick\s*=\s*function\s*\(\s*\)\s*\{
      .*?
    \}\s*;
    \s*
    (?:\}\s*)?
    ''',
    re.S | re.X
)

cm = continue_pat.search(team_block)

if not cm:
    raise SystemExit(
        "ERROR: Continue With Selected Team handler not found"
    )

var = cm.group("var")
decl = cm.group("decl")

replacement = f'''{decl}

    if ({var}) {{
      {var}.onclick = async function () {{
        const teams = getTeams(match);

        if (
          !Array.isArray(teams) ||
          teams.length === 0
        ) {{
          alert("Please create a team first.");
          return;
        }}

        let selectedInfo = null;

        try {{
          selectedInfo = JSON.parse(
            localStorage.getItem(
              "batzo_v11_selected_team"
            ) || "null"
          );
        }} catch (_) {{}}

        let selectedTeam =
          selectedInfo &&
          selectedInfo.teamId
            ? teams.find(
                (item) =>
                  String(item.id) ===
                  String(selectedInfo.teamId)
              )
            : null;

        /*
         * If user already has only/saved team,
         * Continue must work without pressing SELECT again.
         */
        if (!selectedTeam) {{
          selectedTeam = teams[0];
        }}

        try {{
          localStorage.setItem(
            "batzo_v11_selected_team",
            JSON.stringify({{
              match: String(
                match?.id ||
                match?.matchId ||
                match?.key ||
                "active-match"
              ),
              teamId: selectedTeam.id
            }})
          );
        }} catch (_) {{}}

        window.BATZO_SELECTED_TEAM =
          selectedTeam;

        window.BATZO_PENDING_TEAM =
          selectedTeam;

        /*
         * Make sure backend team exists before
         * proceeding to Join Contest.
         */
        try {{
          const synced =
            await syncTeamToBackend(
              match,
              contest,
              selectedTeam
            );

          if (
            synced?.ok &&
            synced?.team?.id
          ) {{
            selectedTeam.backendId =
              synced.team.id;
          }}
        }} catch (error) {{
          console.warn(
            "BATZO continue team sync:",
            error
          );
        }}

        showJoinConfirmation(
          match,
          contest,
          selectedTeam
        );
      }};
    }}
'''

team_block = (
    team_block[:cm.start()] +
    replacement +
    team_block[cm.end():]
)

s = (
    s[:team_start] +
    team_block +
    s[team_end:]
)

ok(
    "CONTINUE WITH SELECTED TEAM FIXED"
)

# ============================================================
# 2. FIX UNDEFINED joinTeamId IN FINAL JOIN
# ============================================================

join_start = s.find(
    "function showJoinConfirmation(match, contest, team) {"
)

if join_start < 0:
    join_start = s.find(
        "  function showJoinConfirmation(match, contest, team) {"
    )

join_ends = [
    s.find(
        "async function showLeaderboard",
        join_start
    ),
    s.find(
        "  async function showLeaderboard",
        join_start
    ),
    s.find(
        "function showLeaderboard",
        join_start
    )
]

join_ends = [
    value for value in join_ends
    if value > join_start
]

if join_start < 0 or not join_ends:
    raise SystemExit(
        "ERROR: showJoinConfirmation block not found"
    )

join_end = min(join_ends)

join_block = s[
    join_start:join_end
]

if "teamId: joinTeamId" in join_block:
    join_block = join_block.replace(
        "teamId: joinTeamId",
        "teamId: team.backendId || team.id",
        1
    )

if "teamId: joinTeamId" in join_block:
    raise SystemExit(
        "ERROR: undefined joinTeamId still present"
    )

s = (
    s[:join_start] +
    join_block +
    s[join_end:]
)

ok("FINAL JOIN TEAM ID FIXED")

# ============================================================
# 3. FIND EXISTING REAL CRICKET EFFECT
# ============================================================

mid = s.find(
    "BATZO real cricket refresh:"
)

if mid < 0:
    raise SystemExit(
        "ERROR: real cricket refresh block not found"
    )

effect_start = max(
    s.rfind(
        "React.useEffect(() => {",
        0,
        mid
    ),
    s.rfind(
        "useEffect(() => {",
        0,
        mid
    )
)

if effect_start < 0:
    raise SystemExit(
        "ERROR: cricket useEffect start not found"
    )

effect_end = s.find(
    "}, []);",
    mid
)

end_token = "}, []);"

if effect_end < 0:
    effect_end = s.find(
        "},[]);",
        mid
    )
    end_token = "},[]);"

if effect_end < 0:
    raise SystemExit(
        "ERROR: cricket useEffect end not found"
    )

effect_end += len(end_token)

old_effect = s[
    effect_start:effect_end
]

if (
    "/api/cricket/live"
    not in old_effect
    or
    "/api/cricket/matches"
    not in old_effect
):
    raise SystemExit(
        "ERROR: wrong React effect detected"
    )

# ============================================================
# 4. RESOLVE LIVE / UPCOMING / RESULT STATE SETTERS
# ============================================================

after = s[
    effect_end:
    effect_end + 5000
]

aliases = {}

for alias in (
    "liveMatches",
    "upcomingMatches",
    "resultMatches"
):
    m = re.search(
        rf'''const\s+{alias}\s*=\s*
        ([A-Za-z_$][\w$]*)\s*;''',
        after,
        re.X
    )

    if m:
        aliases[alias] = m.group(1)

state_decls = list(
    re.finditer(
        r'''const\s*\[
            \s*([A-Za-z_$][\w$]*)\s*,
            \s*([A-Za-z_$][\w$]*)\s*
        \]\s*=\s*
        (?:React\.)?useState\(
            \s*\[\]\s*
        \)\s*;''',
        s[:effect_start],
        re.X
    )
)

state_map = {
    m.group(1): m.group(2)
    for m in state_decls
}

set_live = state_map.get(
    aliases.get(
        "liveMatches",
        ""
    )
)

set_upcoming = state_map.get(
    aliases.get(
        "upcomingMatches",
        ""
    )
)

set_result = state_map.get(
    aliases.get(
        "resultMatches",
        ""
    )
)

if not all(
    (
      set_live,
      set_upcoming,
      set_result
    )
):
    last_three = state_decls[-3:]

    if len(last_three) != 3:
        raise SystemExit(
            "ERROR: cricket state setters not resolved"
        )

    set_live = last_three[0].group(2)
    set_upcoming = last_three[1].group(2)
    set_result = last_three[2].group(2)

print(
    "MATCH SETTERS:",
    set_live,
    set_upcoming,
    set_result
)

# ============================================================
# 5. NEW ROBUST REAL-MATCH LOADER
#
# Important:
# /live     -> trust backend live rows directly
# /upcoming -> trust backend upcoming rows directly
# /matches  -> derive completed + fallback
#
# No 120-day over-filter.
# No league/women deletion.
# ============================================================

new_effect = f'''React.useEffect(() => {{
    let cancelled = false;
    let retryTimer = null;

    const base =
      "https://batzo.onrender.com"
        .replace(/\\\\/+$/, "");

    const CACHE_KEY =
      "batzo_real_matches_cache_v3";

    const fetchJson = async (path) => {{
      const response =
        await fetch(
          base +
          path +
          (path.includes("?") ? "&" : "?") +
          "_=" +
          Date.now(),
          {{
            headers: {{
              Accept: "application/json"
            }},
            cache: "no-store"
          }}
        );

      if (!response.ok) {{
        throw new Error(
          path +
          " HTTP " +
          response.status
        );
      }}

      return response.json();
    }};

    /*
     * Accept every backend response shape.
     */
    const rows = (payload) => {{
      if (Array.isArray(payload))
        return payload;

      if (Array.isArray(payload?.data))
        return payload.data;

      if (Array.isArray(payload?.matches))
        return payload.matches;

      if (Array.isArray(payload?.results))
        return payload.results;

      if (Array.isArray(payload?.response))
        return payload.response;

      if (Array.isArray(payload?.data?.data))
        return payload.data.data;

      if (Array.isArray(payload?.data?.matches))
        return payload.data.matches;

      return [];
    }};

    const bool = (value) =>
      value === true ||
      value === 1 ||
      String(value || "")
        .toLowerCase() === "true";

    const statusText = (match) =>
      String(
        match?.status || ""
      )
        .trim()
        .toLowerCase();

    const timeMs = (match) => {{
      const raw =
        match?.dateTimeGMT ||
        match?.date ||
        "";

      if (!raw) return NaN;

      const normalized =
        /Z$|[+-]\\\\d\\\\d:\\\\d\\\\d$/
          .test(raw)
          ? raw
          : raw + "Z";

      return Date.parse(
        normalized
      );
    }};

    const ended = (match) => {{
      const status =
        statusText(match);

      if (bool(match?.matchEnded))
        return true;

      if (
        /\\\\b(won|completed|complete|finished|drawn|abandoned|cancelled|canceled|no result)\\\\b/
          .test(status)
      ) {{
        return true;
      }}

      const when =
        timeMs(match);

      return (
        Number.isFinite(when) &&
        when <
          Date.now() -
          6 * 60 * 60 * 1000 &&
        !/\\\\b(upcoming|scheduled|not started|starts at|match starts|live|in progress)\\\\b/
          .test(status)
      );
    }};

    const live = (match) => {{
      if (!match || ended(match))
        return false;

      const status =
        statusText(match);

      return (
        bool(match?.matchStarted) ||
        /\\\\b(live|in progress|innings break|lunch|tea break)\\\\b/
          .test(status)
      );
    }};

    const upcoming = (match) => {{
      if (
        !match ||
        ended(match) ||
        live(match)
      ) {{
        return false;
      }}

      const status =
        statusText(match);

      const when =
        timeMs(match);

      return (
        (
          Number.isFinite(when) &&
          when >
            Date.now() -
            5 * 60 * 1000
        ) ||
        /\\\\b(upcoming|scheduled|not started|starts at|match starts)\\\\b/
          .test(status) ||
        !bool(match?.matchStarted)
      );
    }};

    const unique = (items) => {{
      const seen =
        new Set();

      return items.filter(
        (item, index) => {{
          const key =
            item?.id ||
            `${{item?.name || "match"}}-${{item?.dateTimeGMT || item?.date || index}}`;

          if (seen.has(key))
            return false;

          seen.add(key);
          return true;
        }}
      );
    }};

    const shortName =
      (name, meta) =>
        meta?.shortname ||
        String(name || "")
          .split(/\\\\s+/)
          .filter(Boolean)
          .map(
            (part) => part[0]
          )
          .join("")
          .slice(0, 4)
          .toUpperCase() ||
        "TEAM";

    const adaptUpcoming =
      (match, index) => {{
        const teams =
          Array.isArray(
            match?.teams
          )
            ? match.teams.filter(Boolean)
            : [];

        const info =
          Array.isArray(
            match?.teamInfo
          )
            ? match.teamInfo
            : [];

        const a =
          info[0]?.name ||
          teams[0] ||
          "Team 1";

        const b =
          info[1]?.name ||
          teams[1] ||
          "Team 2";

        const metaA =
          info.find(
            (item) =>
              item?.name === a
          ) ||
          info[0] ||
          {{}};

        const metaB =
          info.find(
            (item) =>
              item?.name === b
          ) ||
          info[1] ||
          {{}};

        const nameParts =
          String(
            match?.name || ""
          )
            .split(",")
            .map(
              (part) =>
                part.trim()
            )
            .filter(Boolean);

        const series =
          String(
            match?.series ||
            match?.seriesName ||
            ""
          ).trim() ||
          (
            nameParts.length >= 3
              ? nameParts
                  .slice(2)
                  .join(", ")
              : String(
                  match?.matchType ||
                  "CRICKET"
                ).toUpperCase()
          );

        const matchLine =
          nameParts.length >= 2
            ? nameParts[1]
            : String(
                match?.matchType ||
                "MATCH"
              ).toUpperCase();

        const when =
          timeMs(match);

        const date =
          Number.isFinite(when)
            ? new Date(when)
            : null;

        return {{
          id:
            match?.id ||
            `real-upcoming-${{index}}`,

          raw: match,

          status: "UPCOMING",

          statusText:
            match?.status ||
            "UPCOMING",

          category:
            batzoMatchCategory(match) ||
            "LEAGUE",

          series,
          matchLine,

          venue:
            match?.venue || "",

          league:
            match?.name ||
            series,

          a,
          ac:
            shortName(
              a,
              metaA
            ),

          af:
            batzoTeamFlag(a),

          aImg:
            metaA?.img || "",

          b,
          bc:
            shortName(
              b,
              metaB
            ),

          bf:
            batzoTeamFlag(b),

          bImg:
            metaB?.img || "",

          time:
            date
              ? date.toLocaleDateString(
                  "en-IN",
                  {{
                    day: "numeric",
                    month: "short"
                  }}
                )
              : "Upcoming",

          clock:
            date
              ? date.toLocaleTimeString(
                  "en-IN",
                  {{
                    hour: "numeric",
                    minute: "2-digit"
                  }}
                )
              : "TBA"
        }};
      }};

    const adaptResult =
      (match, index) => {{
        const baseMatch =
          adaptUpcoming(
            match,
            index
          );

        const scores =
          Array.isArray(
            match?.score
          )
            ? match.score
            : [];

        const scoreText =
          (score) => {{
            if (
              !score ||
              score?.r == null
            ) {{
              return "-";
            }}

            const main =
              `${{score.r}}/${{score.w ?? 0}}`;

            return score?.o == null
              ? main
              : `${{main}} (${{score.o}})`;
          }};

        return {{
          ...baseMatch,

          status: "RESULT",

          resultText:
            match?.status ||
            "Match completed",

          scoreA:
            scoreText(
              scores[0]
            ),

          scoreB:
            scoreText(
              scores[1]
            )
        }};
      }};

    const applyCache = () => {{
      try {{
        const cached =
          JSON.parse(
            localStorage.getItem(
              CACHE_KEY
            ) || "null"
          );

        if (!cached)
          return false;

        if (!cancelled) {{
          {set_live}(
            Array.isArray(
              cached.live
            )
              ? cached.live
              : []
          );

          {set_upcoming}(
            Array.isArray(
              cached.upcoming
            )
              ? cached.upcoming
              : []
          );

          {set_result}(
            Array.isArray(
              cached.results
            )
              ? cached.results
              : []
          );
        }}

        return true;
      }} catch (_) {{
        return false;
      }}
    }};

    const refresh = async () => {{
      try {{
        const [
          liveReq,
          matchesReq,
          upcomingReq
        ] =
          await Promise.allSettled([
            fetchJson(
              "/api/cricket/live"
            ),
            fetchJson(
              "/api/cricket/matches"
            ),
            fetchJson(
              "/api/cricket/upcoming"
            )
          ]);

        const liveRows =
          liveReq.status ===
          "fulfilled"
            ? rows(
                liveReq.value
              )
            : [];

        const matchRows =
          matchesReq.status ===
          "fulfilled"
            ? rows(
                matchesReq.value
              )
            : [];

        const upcomingRows =
          upcomingReq.status ===
          "fulfilled"
            ? rows(
                upcomingReq.value
              )
            : [];

        /*
         * TRUST backend-specific endpoints.
         * Do not throw real matches away.
         */
        const liveSource =
          liveRows.length > 0
            ? liveRows
            : matchRows.filter(
                live
              );

        const upcomingSource =
          upcomingRows.length > 0
            ? upcomingRows
            : matchRows.filter(
                upcoming
              );

        const resultSource =
          matchRows.filter(
            ended
          );

        const liveList =
          unique(
            liveSource
          )
            .filter(Boolean)
            .slice(0, 60)
            .map(
              (match) =>
                batzoLiveAdapter({{
                  ...match,
                  batzoCategory:
                    batzoMatchCategory(
                      match
                    ) ||
                    "LEAGUE",
                  status: "LIVE"
                }})
            );

        const upcomingList =
          unique(
            upcomingSource
          )
            .filter(Boolean)
            .sort(
              (a, b) => {{
                const ta =
                  timeMs(a);

                const tb =
                  timeMs(b);

                return Number.isFinite(
                  ta
                )
                  ? Number.isFinite(
                      tb
                    )
                    ? ta - tb
                    : -1
                  : 1;
              }}
            )
            .slice(0, 120)
            .map(
              adaptUpcoming
            );

        const resultList =
          unique(
            resultSource
          )
            .filter(Boolean)
            .sort(
              (a, b) => {{
                const ta =
                  timeMs(a);

                const tb =
                  timeMs(b);

                return Number.isFinite(
                  ta
                )
                  ? Number.isFinite(
                      tb
                    )
                    ? tb - ta
                    : -1
                  : 1;
              }}
            )
            .slice(0, 80)
            .map(
              adaptResult
            );

        const hasAny =
          liveList.length > 0 ||
          upcomingList.length > 0 ||
          resultList.length > 0;

        if (!hasAny) {{
          applyCache();
          return;
        }}

        if (!cancelled) {{
          {set_live}(
            liveList
          );

          {set_upcoming}(
            upcomingList
          );

          {set_result}(
            resultList
          );
        }}

        try {{
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({{
              live:
                liveList,

              upcoming:
                upcomingList,

              results:
                resultList,

              savedAt:
                Date.now()
            }})
          );
        }} catch (_) {{}}

      }} catch (error) {{
        console.warn(
          "BATZO real cricket robust refresh:",
          error
        );

        applyCache();

        if (!cancelled) {{
          clearTimeout(
            retryTimer
          );

          retryTimer =
            setTimeout(
              refresh,
              15000
            );
        }}
      }}
    }};

    refresh();

    const interval =
      setInterval(
        refresh,
        60000
      );

    const onFocus =
      () => refresh();

    const onVisibility =
      () => {{
        if (
          document.visibilityState ===
          "visible"
        ) {{
          refresh();
        }}
      }};

    window.addEventListener(
      "focus",
      onFocus
    );

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {{
      cancelled = true;

      clearTimeout(
        retryTimer
      );

      clearInterval(
        interval
      );

      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    }};
  }}, []);'''

s = (
    s[:effect_start] +
    new_effect +
    s[effect_end:]
)

ok(
  "REAL MATCH LOADER REPLACED"
)

if s == original:
    raise SystemExit(
        "ERROR: no source changes made"
    )

APP.write_text(s)

print(
  "✅ ONLY TEAM CONTINUE/JOIN + MATCH DATA WERE CHANGED"
)
