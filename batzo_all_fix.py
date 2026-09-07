from pathlib import Path
import re

ROOT = Path.home() / "Batzo"
APP = ROOT / "frontend/src/App.jsx"
AUTH = ROOT / "frontend/src/AuthGate.jsx"
CSS = ROOT / "frontend/src/App.css"

app = APP.read_text()
auth = AUTH.read_text()
css = CSS.read_text()

def exact(text, old, new, label, required=True):
    if old in text:
        print("FIX:", label)
        return text.replace(old, new, 1)
    if required:
        raise SystemExit("ERROR anchor missing: " + label)
    print("SKIP:", label)
    return text

# ===== 1. REMOVE FLOATING LOGOUT FROM REAL SOURCE =====
logout_re = re.compile(
    r'''[ \t]*<button\s*
        type="button"\s*
        onClick=\{logout\}\s*
        style=\{\{\s*
        position:\s*"fixed",.*?
        \}\}\s*>\s*
        LOGOUT\s*
        </button>\s*''',
    re.S | re.X,
)

auth2, nlogout = logout_re.subn("", auth)

if nlogout == 0:
    if 'onClick={logout}' in auth and 'position: "fixed"' in auth:
        raise SystemExit(
            "ERROR: floating LOGOUT found but could not remove"
        )
    print("SKIP: floating LOGOUT already removed")
else:
    auth = auth2
    print("FIX: floating LOGOUT removed x", nlogout)

# ===== 2. COUNTRY FLAG FALLBACK =====
marker = "BATZO_TEAM_FLAG_HELPER_FINAL_V3"

if marker not in app:
    anchor = "function batzoLiveAdapter(m) {"

    if anchor not in app:
        raise SystemExit("ERROR: batzoLiveAdapter missing")

    helper = r'''/* BATZO_TEAM_FLAG_HELPER_FINAL_V3 */
function batzoTeamFlag(value) {
  const clean = String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\b(women|womens|woman|ladies|men|mens)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const flags = {
    "india":"🇮🇳",
    "australia":"🇦🇺",
    "pakistan":"🇵🇰",
    "new zealand":"🇳🇿",
    "south africa":"🇿🇦",
    "sri lanka":"🇱🇰",
    "bangladesh":"🇧🇩",
    "afghanistan":"🇦🇫",
    "ireland":"🇮🇪",
    "netherlands":"🇳🇱",
    "nepal":"🇳🇵",
    "zimbabwe":"🇿🇼",
    "united states":"🇺🇸",
    "united states of america":"🇺🇸",
    "usa":"🇺🇸",
    "canada":"🇨🇦",
    "uae":"🇦🇪",
    "united arab emirates":"🇦🇪",
    "oman":"🇴🇲",
    "namibia":"🇳🇦",
    "kenya":"🇰🇪",
    "hong kong":"🇭🇰",
    "england":"🏴",
    "scotland":"🏴",
    "west indies":"🌴"
  };

  if (flags[clean]) return flags[clean];

  for (const key of Object.keys(flags)) {
    if (
      clean === key ||
      clean.startsWith(key + " ")
    ) {
      return flags[key];
    }
  }

  return "🏏";
}

'''

    app = app.replace(
        anchor,
        helper + anchor,
        1
    )

# ===== 3. LIVE FLAGS =====
ls = app.find("function batzoLiveAdapter(m) {")
le = app.find("\nconst liveMatches", ls)

if ls < 0 or le < 0:
    raise SystemExit("ERROR: live adapter range missing")

live = app[ls:le]

live = live.replace(
    '    af: "🏏",',
    '    af: batzoTeamFlag(teamA?.name || teams[0]),',
    1
)

live = live.replace(
    '    bf: "🏏",',
    '    bf: batzoTeamFlag(teamB?.name || teams[1]),',
    1
)

app = app[:ls] + live + app[le:]

# ===== 4. IMAGE FIRST, FLAG FALLBACK =====
gs = app.find("function BatzoMatchSeriesGroup({")
ge = app.find(
    "/* BATZO_MATCH_HUB_COMPONENT_V1_END */",
    gs
)

if gs < 0 or ge < 0:
    raise SystemExit("ERROR: match card component missing")

group = app[gs:ge]

fallback = '''                  ) : (
                    "🏏"
                  )}'''

if fallback in group:
    group = group.replace(
        fallback,
        '''                  ) : (
                    match.af || "🏏"
                  )}''',
        1
    )

if fallback in group:
    group = group.replace(
        fallback,
        '''                  ) : (
                    match.bf || "🏏"
                  )}''',
        1
    )

app = app[:gs] + group + app[ge:]

# ===== 5. ENABLE WOMEN + CPL/BBL/LEAGUES =====
app = exact(
    app,
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
    "international women",
    False
)

app = exact(
    app,
    '''      /*
       * Everything else:
       * foreign domestic, franchise, county, CPL, BBL etc.
       */
      return null;''',
    '''      /*
       * Foreign domestic, franchise, county,
       * CPL, BBL and other series.
       */
      return batzoIsWomenMatch(m)
        ? "LEAGUE WOMEN"
        : "LEAGUE";''',
    "foreign leagues",
    False
)

# ===== 6. UPCOMING SERIES + LOGOS =====
us = app.find(
    "    const upcomingAdapter = (m, index) => {"
)

ue = app.find(
    "    const resultAdapter = (m, index) => {",
    us
)

if us < 0 or ue < 0:
    raise SystemExit("ERROR: upcoming adapter missing")

up = app[us:ue]

if "BATZO_UPCOMING_SERIES_FINAL_V3" not in up:
    up = exact(
        up,
        '''      } catch (_) {}

      return {''',
        '''      } catch (_) {}

      /* BATZO_UPCOMING_SERIES_FINAL_V3 */
      const nameParts = String(m?.name || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const seriesName =
        String(
          m?.series ||
          m?.seriesName ||
          ""
        ).trim() ||
        (
          nameParts.length >= 3
            ? nameParts.slice(2).join(", ")
            : String(
                m?.matchType || "CRICKET"
              ).toUpperCase()
        );

      const matchLine =
        nameParts.length >= 2
          ? nameParts[1]
          : String(
              m?.matchType || "Match"
            ).toUpperCase();

      return {''',
        "upcoming series parser"
    )

up = up.replace(
    '''        af: "🏏",

        b,''',
    '''        af: batzoTeamFlag(a),
        aImg: metaA?.img || "",

        b,''',
    1
)

up = up.replace(
    '''        bf: "🏏",

        time:''',
    '''        bf: batzoTeamFlag(b),
        bImg: metaB?.img || "",

        time:''',
    1
)

if "        series: seriesName," not in up:
    up = up.replace(
        '''        status: "UPCOMING",
        category:''',
        '''        series: seriesName,
        matchLine,
        venue: m?.venue || "",
        status: "UPCOMING",
        category:''',
        1
    )

app = app[:us] + up + app[ue:]

# ===== 7. UPCOMING SOURCE + 120 DAYS =====
app = exact(
    app,
    '''        const upcomingSource =
          upcomingRows.length > 0
            ? upcomingRows
            : matchRows;''',
    '''        const upcomingSource = unique([
          ...upcomingRows,
          ...matchRows
        ]);''',
    "merge upcoming APIs",
    False
)

app = app.replace(
    "/* Only upcoming matches in the next 30 days. */",
    "/* Upcoming matches in the next 120 days. */",
    1
)

app = app.replace(
    "30 * 24 * 60 * 60 * 1000",
    "120 * 24 * 60 * 60 * 1000",
    1
)

# ===== 8. SERIES/WOMEN FILTERS =====
app = exact(
    app,
    '''      if (
        matchesFilter === "league" &&
        !category.startsWith("INDIA LEAGUE")
      ) {
        return false;
      }''',
    '''      if (
        matchesFilter === "league" &&
        !category.includes("LEAGUE")
      ) {
        return false;
      }''',
    "series filter",
    False
)

app = exact(
    app,
    '''      if (
        matchesFilter === "women" &&
        category !== "INDIA DOMESTIC WOMEN" &&
        category !== "INDIA LEAGUE WOMEN"
      ) {
        return false;
      }''',
    '''      if (
        matchesFilter === "women" &&
        !category.includes("WOMEN")
      ) {
        return false;
      }''',
    "women filter",
    False
)

app = app.replace(
    "\n                League\n",
    "\n                Series\n",
    1
)

# ===== 9. RESULT -> COMPLETE =====
app = app.replace(
    "\n                RESULT\n",
    "\n                COMPLETE\n",
    1
)

app = app.replace(
    '                   : "RECENT RESULTS"}',
    '                   : "COMPLETED MATCHES"}',
    1
)

app = app.replace(
    '                       : "No recent results available"}',
    '                       : "No completed matches available"}',
    1
)

# ===== 10. CONTEST ID ALIGNMENT =====
cs = app.find("function getContests() {")
ce = app.find("\n  function players() {", cs)

if cs < 0 or ce < 0:
    raise SystemExit("ERROR: getContests missing")

contest_block = app[cs:ce]

contest_block = contest_block.replace(
    "      id: 900001,",
    "      id: 1,",
    1
)

contest_block = contest_block.replace(
    '      match: "BATZO DEMO: INDIA vs AUSTRALIA",',
    '      match: "IND vs AUS",',
    1
)

contest_block = contest_block.replace(
    '      matchName: "BATZO DEMO: INDIA vs AUSTRALIA",',
    '      matchName: "India vs Australia",',
    1
)

contest_block = contest_block.replace(
    "      matchId: 3,",
    "      matchId: 1,",
    1
)

app = app[:cs] + contest_block + app[ce:]

app = app.replace(
    '      id: "batzo-free-demo-visible",',
    '''      id: 1,
      matchId: 1,''',
    1
)

app = app.replace(
    '      match: "BATZO DEMO: INDIA vs AUSTRALIA",',
    '      match: "IND vs AUS",',
    1
)

# ===== 11. FREE ENTRY REALLY ₹0 =====
app = exact(
    app,
    '''  function entryAmount(contest) {
    const raw = String(contest.entry || "49");
    const n = Number(raw.replace(/[^\\d.]/g, ""));
    return Number.isFinite(n) ? n : 49;
  }''',
    '''  function entryAmount(contest) {
    const raw =
      contest?.entry ??
      contest?.entryFee ??
      contest?.entry_fee ??
      0;

    const n = Number(
      String(raw).replace(/[^\\d.]/g, "")
    );

    return Number.isFinite(n)
      ? n
      : 0;
  }''',
    "zero entry fee",
    False
)

# ===== 12. TEAM BACKEND SYNC =====
app = exact(
    app,
    '''      const matchId = Number(
        match && (match.id || match.match_id)
      );''',
    '''      const matchId = Number(
        contest?.matchId ||
        contest?.match_id ||
        match?.matchId ||
        match?.match_id ||
        match?.id ||
        1
      );''',
    "team backend match id",
    False
)

app = app.replace(
    '      const response = await fetch("/api/teams", {',
    '      const response = await fetch(batzoApiBase() + "/api/teams", {',
    1
)

app = app.replace(
    "          captainId:team.captainId,",
    "          captainId:team.captainId || team.captain,",
    1
)

app = app.replace(
    "          viceCaptainId:team.viceCaptainId",
    "          viceCaptainId:team.viceCaptainId || team.viceCaptain",
    1
)

# ===== 13. SAVE BACKEND TEAM ID =====
old_cb = '''      syncTeamToBackend(match, contest, team).then(function(result) {
        if (result.ok) {
          console.log("BATZO: Team Builder backend sync PASS");
        }
      });'''

new_cb = '''      syncTeamToBackend(match, contest, team).then(function(result) {
        if (
          result &&
          result.ok &&
          result.team &&
          result.team.id
        ) {
          team.backendId = result.team.id;

          const refreshed =
            getTeams(match).map(function(x) {
              return String(x.id) === String(team.id)
                ? Object.assign(
                    {},
                    x,
                    { backendId: result.team.id }
                  )
                : x;
            });

          saveTeams(match, refreshed);

          window.BATZO_SELECTED_TEAM = team;
          window.BATZO_PENDING_TEAM = team;

          console.log(
            "BATZO: Team Builder backend sync PASS",
            result.team.id
          );
        }
      });'''

app = exact(
    app,
    old_cb,
    new_cb,
    "persist backend team id",
    False
)

# ===== 14. SYNC TEAM BEFORE JOIN =====
join_anchor = '''        if (!base) {
          throw new Error(
            "API URL is not configured."
          );
        }
        const response = await fetch('''

join_insert = '''        if (!base) {
          throw new Error(
            "API URL is not configured."
          );
        }

        let joinTeamId =
          team.backendId || "";

        if (!joinTeamId) {
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
            joinTeamId =
              synced.team.id;

            team.backendId =
              joinTeamId;

            const refreshed =
              getTeams(match).map(function(x) {
                return String(x.id) ===
                  String(team.id)
                  ? Object.assign(
                      {},
                      x,
                      { backendId: joinTeamId }
                    )
                  : x;
              });

            saveTeams(
              match,
              refreshed
            );
          }
        }

        if (!joinTeamId) {
          throw new Error(
            "Team could not be synced. Please try again."
          );
        }

        const response = await fetch('''

app = exact(
    app,
    join_anchor,
    join_insert,
    "join team sync",
    False
)

app = app.replace(
    "              teamId: team.backendId || team.id",
    "              teamId: joinTeamId",
    1
)

# ===== 15. LOGO CSS =====
if "BATZO_REAL_TEAM_LOGO_FINAL_V3" not in css:
    css += r'''

/* BATZO_REAL_TEAM_LOGO_FINAL_V3 */
.bz-team-logo img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 50%;
  display: block;
}
'''

# ===== VALIDATE BEFORE WRITING =====
checks = {
    "FLOATING LOGOUT":
        not (
          'position: "fixed"' in auth and
          'onClick={logout}' in auth
        ),

    "FLAGS":
        marker in app,

    "UPCOMING 120 DAYS":
        "120 * 24 * 60 * 60 * 1000" in app,

    "SERIES":
        "\n                Series\n" in app,

    "COMPLETE":
        "\n                COMPLETE\n" in app,

    "TEAM API":
        'batzoApiBase() + "/api/teams"' in app
}

failed = [
    name
    for name, passed in checks.items()
    if not passed
]

if failed:
    raise SystemExit(
        "ERROR VALIDATION: " +
        ", ".join(failed)
    )

APP.write_text(app)
AUTH.write_text(auth)
CSS.write_text(css)

print("====================================")
print("ALL SOURCE FIXES APPLIED")
print("====================================")
