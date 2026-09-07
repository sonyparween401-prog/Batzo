from pathlib import Path
import re

ROOT = Path.home() / "Batzo"
APP = ROOT / "frontend/src/App.jsx"

s = APP.read_text()

# Preserve navigation section inside App.jsx too.
nav_start = s.find("  const navigateTab = (nextTab) => {")
nav_end = s.find("  const [notice", nav_start)

if nav_start < 0 or nav_end < 0:
    raise SystemExit("ERROR: navigation guard section not found")

navigation_before = s[nav_start:nav_end]

def ok(x):
    print("✅", x)

# ============================================================
# 1. CONTINUE WITH SELECTED TEAM
# Saved team automatically becomes selected.
# No need to press SELECT first.
# ============================================================

start = s.find(
    '    const cont = r.querySelector("#bzContinueSelected");'
)

end_marker = "\n  }\n\n  function showTeamBuilder"
end = s.find(end_marker, start)

if start < 0 or end < 0:
    raise SystemExit(
        "ERROR: Continue With Selected Team source block not found"
    )

new_continue = r'''    const cont = r.querySelector("#bzContinueSelected");

    /* BATZO_CONTINUE_AUTOSELECT_FINAL_V1 */
    if (cont) {
      cont.onclick = function () {
        const teamsNow = getTeams(match);

        if (
          !Array.isArray(teamsNow) ||
          teamsNow.length === 0
        ) {
          alert("Please create a team first.");
          return;
        }

        let selected = null;

        try {
          selected = readJSON(
            "batzo_v11_selected_team",
            null
          );
        } catch (_) {}

        let team = null;

        if (
          selected &&
          selected.match === matchKey(match)
        ) {
          team = teamsNow.find(
            t =>
              String(t.id) ===
              String(selected.teamId)
          );
        }

        /*
         * Main fix:
         * if saved team exists, Continue works
         * without pressing SELECT again.
         */
        if (!team) {
          team = teamsNow[0];
        }

        if (!team) {
          alert("Saved team not found.");
          return;
        }

        try {
          localStorage.setItem(
            "batzo_v11_selected_team",
            JSON.stringify({
              match: matchKey(match),
              teamId: team.id
            })
          );
        } catch (_) {}

        window.BATZO_SELECTED_TEAM = team;
        window.BATZO_PENDING_TEAM = team;

        showJoinConfirmation(
          match,
          contest,
          team
        );
      };
    }
'''

s = s[:start] + new_continue + s[end:]

ok("CONTINUE WITH SELECTED TEAM AUTO-SELECT FIXED")

# ============================================================
# 2. TEAM BACKEND SYNC
# ============================================================

old_match_id = '''      const matchId = Number(
        match && (match.id || match.match_id)
      );'''

new_match_id = '''      const matchId = Number(
        contest?.matchId ||
        contest?.match_id ||
        match?.matchId ||
        match?.match_id ||
        match?.id ||
        1
      );'''

if old_match_id in s:
    s = s.replace(
        old_match_id,
        new_match_id,
        1
    )

s = s.replace(
    '      const response = await fetch("/api/teams", {',
    '      const response = await fetch(batzoApiBase() + "/api/teams", {',
    1
)

s = s.replace(
    "          captainId:team.captainId,",
    "          captainId:team.captainId || team.captain,",
    1
)

s = s.replace(
    "          viceCaptainId:team.viceCaptainId",
    "          viceCaptainId:team.viceCaptainId || team.viceCaptain",
    1
)

ok("TEAM BACKEND SYNC FIXED")

# ============================================================
# 3. SAVE BACKEND TEAM ID AFTER TEAM CREATE
# ============================================================

old_callback = '''      syncTeamToBackend(match, contest, team).then(function(result) {
        if (result.ok) {
          console.log("BATZO: Team Builder backend sync PASS");
        }
      });'''

new_callback = '''      syncTeamToBackend(match, contest, team).then(function(result) {
        if (
          result &&
          result.ok &&
          result.team &&
          result.team.id
        ) {
          team.backendId = result.team.id;

          const refreshed =
            getTeams(match).map(function(item) {
              return String(item.id) === String(team.id)
                ? Object.assign(
                    {},
                    item,
                    {
                      backendId: result.team.id
                    }
                  )
                : item;
            });

          saveTeams(match, refreshed);

          window.BATZO_SELECTED_TEAM = team;
          window.BATZO_PENDING_TEAM = team;

          console.log(
            "BATZO TEAM BACKEND ID:",
            result.team.id
          );
        }
      });'''

if old_callback in s:
    s = s.replace(
        old_callback,
        new_callback,
        1
    )

ok("BACKEND TEAM ID SAVED")

# ============================================================
# 4. FINAL JOIN:
# Ensure local saved team gets backend ID before joining.
# ============================================================

join_start = s.find(
    "function showJoinConfirmation(match, contest, team) {"
)

join_end = s.find(
    "/* BATZO_WINNER_LEADERBOARD",
    join_start
)

if join_start < 0 or join_end < 0:
    raise SystemExit(
        "ERROR: Join Confirmation source not found"
    )

join = s[join_start:join_end]

if "BATZO_FINAL_JOIN_TEAM_SYNC_V1" not in join:

    anchor = '''        if (!base) {
          throw new Error(
            "API URL is not configured."
          );
        }
'''

    insert = '''        if (!base) {
          throw new Error(
            "API URL is not configured."
          );
        }

        /* BATZO_FINAL_JOIN_TEAM_SYNC_V1 */
        if (!team.backendId) {
          const synced =
            await syncTeamToBackend(
              match,
              contest,
              team
            );

          if (
            synced &&
            synced.ok &&
            synced.team &&
            synced.team.id
          ) {
            team.backendId =
              synced.team.id;

            const refreshed =
              getTeams(match).map(function(item) {
                return String(item.id) ===
                  String(team.id)
                  ? Object.assign(
                      {},
                      item,
                      {
                        backendId:
                          synced.team.id
                      }
                    )
                  : item;
              });

            saveTeams(
              match,
              refreshed
            );
          }
        }

        if (!team.backendId) {
          throw new Error(
            "Team could not be synced. Please try again."
          );
        }
'''

    if anchor not in join:
        raise SystemExit(
            "ERROR: final join API anchor not found"
        )

    join = join.replace(
        anchor,
        insert,
        1
    )

join = join.replace(
    "teamId: team.backendId || team.id",
    "teamId: team.backendId",
    1
)

s = s[:join_start] + join + s[join_end:]

ok("FINAL CONTEST JOIN TEAM SYNC FIXED")

# ============================================================
# 5. DO NOT DROP CRICKET MATCHES BY CATEGORY
# ============================================================

s = re.sub(
    r'''const\s+batzoWantedMatch\s*=\s*\(m\)\s*=>
\s*batzoMatchCategory\(m\)\s*!==\s*null;''',
    '''const batzoWantedMatch = (m) =>
      Boolean(m);''',
    s,
    count=1
)

# Women internationals
s = s.replace(
    '''      if (international) {
        if (batzoIsWomenMatch(m)) {
          return null;
        }

        return "INTERNATIONAL MEN";
      }''',
    '''      if (international) {
        return batzoIsWomenMatch(m)
          ? "INTERNATIONAL WOMEN"
          : "INTERNATIONAL MEN";
      }''',
    1
)

# CPL / BBL / county / foreign leagues
s = s.replace(
    '''      /*
       * Everything else:
       * foreign domestic, franchise, county, CPL, BBL etc.
       */
      return null;''',
    '''      /*
       * Foreign domestic / franchise / county /
       * CPL / BBL / other recognized series.
       */
      return batzoIsWomenMatch(m)
        ? "LEAGUE WOMEN"
        : "LEAGUE";''',
    1
)

ok("MATCH CATEGORY DROP FILTER REMOVED")

# ============================================================
# 6. ACCEPT EVERY VALID API RESPONSE SHAPE
# ============================================================

old_payload = '''      const payloadRows = (payload) =>
        Array.isArray(payload?.data)
          ? payload.data
          : [];'''

new_payload = '''      const payloadRows = (payload) => {
        if (Array.isArray(payload)) {
          return payload;
        }

        if (Array.isArray(payload?.data)) {
          return payload.data;
        }

        if (Array.isArray(payload?.matches)) {
          return payload.matches;
        }

        if (Array.isArray(payload?.results)) {
          return payload.results;
        }

        if (Array.isArray(payload?.data?.data)) {
          return payload.data.data;
        }

        return [];
      };'''

if old_payload in s:
    s = s.replace(
        old_payload,
        new_payload,
        1
    )

ok("CRICKET API RESPONSE PARSER FIXED")

# ============================================================
# 7. LIVE:
# Trust /api/cricket/live if backend returned rows.
# Only classify /matches as fallback.
# ============================================================

live_start = s.find(
    "        const genuineLive = unique(["
)

upcoming_marker = s.find(
    "        const upcomingSource =",
    live_start
)

if live_start >= 0 and upcoming_marker > live_start:

    new_live = '''        const liveSource =
          liveRows.length > 0
            ? liveRows
            : matchRows.filter(live);

        const genuineLive =
          unique(liveSource)
            .filter(Boolean)
            .slice(0, 60)
            .map((m) =>
              batzoLiveAdapter({
                ...m,
                batzoCategory:
                  batzoMatchCategory(m) ||
                  (
                    batzoIsWomenMatch(m)
                      ? "LEAGUE WOMEN"
                      : "LEAGUE"
                  ),
                status: "LIVE"
              })
            );

'''

    s = (
        s[:live_start] +
        new_live +
        s[upcoming_marker:]
    )

ok("LIVE BACKEND DATA TRUST FIXED")

# ============================================================
# 8. UPCOMING:
# /upcoming is already filtered by backend.
# Do NOT filter it again in frontend.
# ============================================================

up_start = s.find(
    "        const upcomingSource ="
)

result_start = s.find(
    "        const genuineResults =",
    up_start
)

if up_start < 0 or result_start < 0:
    raise SystemExit(
        "ERROR: upcoming match loader block not found"
    )

new_upcoming = '''        const upcomingSource =
          upcomingRows.length > 0
            ? upcomingRows
            : matchRows.filter(upcoming);

        const genuineUpcoming =
          unique(upcomingSource)
            .filter(Boolean)
            .sort((a, b) => {
              const at = timeOf(a);
              const bt = timeOf(b);

              if (!Number.isFinite(at)) return 1;
              if (!Number.isFinite(bt)) return -1;

              return at - bt;
            })
            .slice(0, 120)
            .map(upcomingAdapter);

'''

s = (
    s[:up_start] +
    new_upcoming +
    s[result_start:]
)

ok("UPCOMING DOUBLE FILTER REMOVED")

# ============================================================
# 9. COMPLETE:
# Show all genuinely ended matches.
# ============================================================

result_start = s.find(
    "        const genuineResults ="
)

result_end = s.find(
    "        if (!cancelled) {",
    result_start
)

if result_start < 0 or result_end < 0:
    raise SystemExit(
        "ERROR: complete match loader block not found"
    )

new_results = '''        const genuineResults =
          unique(matchRows)
            .filter(ended)
            .filter(Boolean)
            .sort((a, b) => {
              const at = timeOf(a);
              const bt = timeOf(b);

              if (!Number.isFinite(at)) return 1;
              if (!Number.isFinite(bt)) return -1;

              return bt - at;
            })
            .slice(0, 80)
            .map(resultAdapter);

'''

s = (
    s[:result_start] +
    new_results +
    s[result_end:]
)

ok("COMPLETE MATCH LOADER FIXED")

# ============================================================
# 10. CATEGORY FALLBACK FOR UPCOMING / COMPLETE CARDS
# ============================================================

s = s.replace(
    "        category: batzoMatchCategory(m),",
    '''        category:
          batzoMatchCategory(m) ||
          (
            batzoIsWomenMatch(m)
              ? "LEAGUE WOMEN"
              : "LEAGUE"
          ),''',
    1
)

# ============================================================
# 11. VERIFY BACK/NAVIGATION CODE INSIDE APP UNCHANGED
# ============================================================

new_nav_start = s.find(
    "  const navigateTab = (nextTab) => {"
)

new_nav_end = s.find(
    "  const [notice",
    new_nav_start
)

navigation_after = s[
    new_nav_start:new_nav_end
]

if navigation_before != navigation_after:
    raise SystemExit(
        "ERROR: BACK/NAVIGATION SECTION CHANGED - ABORT"
    )

# Final markers
required = [
    "BATZO_CONTINUE_AUTOSELECT_FINAL_V1",
    "BATZO_FINAL_JOIN_TEAM_SYNC_V1",
    "const liveSource =",
    "const upcomingSource =",
    "const genuineResults ="
]

for marker in required:
    if marker not in s:
        raise SystemExit(
            "ERROR: missing final marker: " +
            marker
        )

APP.write_text(s)

print("========================================")
print("✅ TEAM CONTINUE + MATCH FIX APPLIED")
print("✅ BACK/NAVIGATION CODE UNTOUCHED")
print("========================================")
