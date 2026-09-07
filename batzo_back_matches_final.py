from pathlib import Path
import re

ROOT = Path.home() / "Batzo"
APP = ROOT / "frontend/src/App.jsx"
AUTH = ROOT / "frontend/src/AuthGate.jsx"
NAV = ROOT / "frontend/src/core/batzo-navigation-controller.js"

s = APP.read_text()
auth = AUTH.read_text()
nav = NAV.read_text()

def done(msg):
    print("✅", msg)

# ============================================================
# 1. REMOVE FLOATING LOGOUT FROM AUTHGATE SOURCE
# ============================================================

logout_pattern = re.compile(
    r'''
    \s*<button
    \s+type="button"
    \s+onClick=\{logout\}
    \s+style=\{\{
    .*?
    position:\s*"fixed"
    .*?
    \}\}
    \s*>
    \s*LOGOUT\s*
    </button>
    ''',
    re.S | re.X
)

auth, removed = logout_pattern.subn("", auth)

if removed:
    done(f"FLOATING LOGOUT REMOVED x{removed}")
else:
    print("SKIP: floating logout already removed")

# ============================================================
# 2. BOTTOM TAB NAVIGATION = BACK DIRECTLY HOME
# ============================================================

navtab_pattern = re.compile(
    r'''
      const\ navigateTab\ =\ \(nextTab\)\ =>\ \{
      .*?
      \n\ \ \};
    ''',
    re.S | re.X
)

new_navtab = '''  const navigateTab = (nextTab) => {
    /* BATZO_BOTTOM_TAB_BACK_HOME_FINAL */
    if (!nextTab || nextTab === tab) return;

    /*
     * Bottom navigation is not a browser-history stack.
     * Android Back from Matches / Contest / My Team / Wallet
     * returns directly Home.
     */
    batzoTabHistory.current = [];

    try {
      clearNavigation();
    } catch (_) {}

    batzoPreviousTab.current = "home";

    setTab(nextTab);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };'''

s2, n = navtab_pattern.subn(
    new_navtab,
    s,
    count=1
)

if n != 1:
    raise SystemExit(
        "ERROR: navigateTab function not found"
    )

s = s2
done("BOTTOM TAB BACK STACK REMOVED")

# ============================================================
# 3. HOME MUST CLEAR OLD NAVIGATION
# ============================================================

home_pattern = re.compile(
    r'''
      const\ goHome\ =\ \(\)\ =>\ \{
      .*?
      \n\ \ \};
    ''',
    re.S | re.X
)

new_home = '''  const goHome = () => {
    batzoTabHistory.current = [];

    try {
      clearNavigation();
    } catch (_) {}

    batzoPreviousTab.current = "home";

    setTab("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };'''

s, n = home_pattern.subn(
    new_home,
    s,
    count=1
)

if n:
    done("HOME NAVIGATION RESET FIXED")

# ============================================================
# 4. ANDROID PHYSICAL BACK:
#    DYNAMIC SCREEN FIRST, NEVER BROWSER HISTORY
# ============================================================

android_anchor = '''      try {
        // First: authentication/inner-screen navigation.'''

android_new = '''      try {
        /*
         * BATZO_ANDROID_FLOW_BACK_FINAL
         *
         * Raw contest/team screens replace #root with HTML.
         * Their visible Back button is the only correct authority.
         */
        const flowBack =
          document.getElementById("bzV11Back") ||
          document.getElementById("bzBack") ||
          document.getElementById("bzContestBack") ||
          document.getElementById("bzTeamsBack");

        if (
          flowBack &&
          flowBack.offsetParent !== null
        ) {
          flowBack.click();
          return;
        }

        // First: authentication/inner-screen navigation.'''

if android_anchor in s:
    s = s.replace(
        android_anchor,
        android_new,
        1
    )
    done("ANDROID DYNAMIC BACK FIXED")
else:
    print("SKIP: Android dynamic back marker already changed")

old_fallback = '''        // Final SPA fallback.
        if (window.history.length > 1) {
          window.history.back();
        }'''

new_fallback = '''        /*
         * Final SPA fallback.
         * NEVER replay browser history.
         * Non-home Batzo tabs return directly Home.
         */
        window.dispatchEvent(
          new Event("batzo-native-back")
        );'''

if old_fallback in s:
    s = s.replace(
        old_fallback,
        new_fallback,
        1
    )
    done("BROWSER HISTORY BACK REMOVED")

# ============================================================
# 5. V11 CONTEST DETAILS BACK -> HOME
# ============================================================

contest_start = s.find(
    "  function showContestDetails(contest) {"
)

contest_end = s.find(
    "  function showMyTeams(match, contest) {",
    contest_start
)

if contest_start >= 0 and contest_end > contest_start:
    block = s[contest_start:contest_end]

    block = re.sub(
        r'''
        r\.querySelector\("#bzV11Back"\)\.onclick
        \s*=\s*function\s*\(\)\s*\{
        .*?
        \};
        ''',
        '''r.querySelector("#bzV11Back").onclick = function () {
      goBack();
    };''',
        block,
        count=1,
        flags=re.S | re.X
    )

    s = (
        s[:contest_start] +
        block +
        s[contest_end:]
    )

    done("CONTEST BACK -> HOME")

# ============================================================
# 6. MY TEAMS BACK -> HOME
# ============================================================

teams_start = s.find(
    "  function showMyTeams(match, contest) {"
)

teams_end = s.find(
    "  function showTeamBuilder(",
    teams_start
)

if teams_start >= 0 and teams_end > teams_start:
    block = s[teams_start:teams_end]

    old = '''    r.querySelector("#bzV11Back").onclick = function () {
      showContestDetails(contest);
    };'''

    if old in block:
        block = block.replace(
            old,
            '''    r.querySelector("#bzV11Back").onclick = function () {
      goBack();
    };''',
            1
        )

    s = (
        s[:teams_start] +
        block +
        s[teams_end:]
    )

    done("MY TEAMS BACK -> HOME")

# ============================================================
# 7. NAV CONTROLLER RECOGNIZES V11 BACK
# ============================================================

if 'visibleElement("bzV11Back")' not in nav:
    anchor = '''function handleDynamicBack() {
  /*
   * Team Builder'''

    replacement = '''function handleDynamicBack() {
  /*
   * BATZO V11 dynamic screen Back.
   * Always use the currently visible screen's own Back action.
   */
  const v11Back =
    visibleElement("bzV11Back");

  if (v11Back) {
    v11Back.click();
    return true;
  }

  /*
   * Team Builder'''

    if anchor in nav:
        nav = nav.replace(
            anchor,
            replacement,
            1
        )
        done("CENTRAL NAV V11 BACK FIXED")

# ============================================================
# 8. MATCH CATEGORY:
#    KEEP INTERNATIONAL WOMEN + ALL LEAGUES
# ============================================================

international_pattern = re.compile(
    r'''
    if\s*\(international\)\s*\{
      \s*if\s*\(batzoIsWomenMatch\(m\)\)\s*\{
        \s*return\s+null;
      \s*\}
      \s*return\s+"INTERNATIONAL MEN";
    \s*\}
    ''',
    re.S | re.X
)

s, n = international_pattern.subn(
    '''if (international) {
        return batzoIsWomenMatch(m)
          ? "INTERNATIONAL WOMEN"
          : "INTERNATIONAL MEN";
      }''',
    s,
    count=1
)

if n:
    done("INTERNATIONAL WOMEN ENABLED")

foreign_old = '''      /*
       * Everything else:
       * foreign domestic, franchise, county, CPL, BBL etc.
       */
      return null;'''

foreign_new = '''      /*
       * Foreign domestic / franchise / county /
       * CPL / BBL / other recognized cricket series.
       */
      return batzoIsWomenMatch(m)
        ? "LEAGUE WOMEN"
        : "LEAGUE";'''

if foreign_old in s:
    s = s.replace(
        foreign_old,
        foreign_new,
        1
    )
    done("CPL BBL FOREIGN SERIES ENABLED")

# No real cricket row should disappear from ALL tab.
s = re.sub(
    r'''
    const\s+batzoWantedMatch\s*=\s*\(m\)\s*=>
    \s*batzoMatchCategory\(m\)\s*!==\s*null;
    ''',
    '''const batzoWantedMatch = (m) =>
      Boolean(m);''',
    s,
    count=1,
    flags=re.S | re.X
)

done("MATCH DROP FILTER DISABLED")

# ============================================================
# 9. TEAM FLAGS
# ============================================================

if "function batzoTeamFlag(" not in s:
    anchor = "function batzoLiveAdapter(m) {"

    helper = r'''/* BATZO_TEAM_FLAG_FINAL */
function batzoTeamFlag(value) {
  const name = String(value || "")
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
    "usa":"🇺🇸",
    "united states":"🇺🇸",
    "canada":"🇨🇦",
    "uae":"🇦🇪",
    "united arab emirates":"🇦🇪",
    "oman":"🇴🇲",
    "namibia":"🇳🇦",
    "england":"🏴",
    "scotland":"🏴",
    "west indies":"🌴"
  };

  if (flags[name]) {
    return flags[name];
  }

  for (const key of Object.keys(flags)) {
    if (name.startsWith(key + " ")) {
      return flags[key];
    }
  }

  return "🏏";
}

'''

    if anchor not in s:
        raise SystemExit(
            "ERROR: batzoLiveAdapter missing"
        )

    s = s.replace(
        anchor,
        helper + anchor,
        1
    )

    done("TEAM FLAG HELPER ADDED")

# Live adapter flags
live_start = s.find(
    "function batzoLiveAdapter(m) {"
)

live_end = s.find(
    "\nconst liveMatches",
    live_start
)

if live_start >= 0 and live_end > live_start:
    block = s[live_start:live_end]

    block = block.replace(
        '    af: "🏏",',
        '    af: batzoTeamFlag(teamA?.name || teams[0]),',
        1
    )

    block = block.replace(
        '    bf: "🏏",',
        '    bf: batzoTeamFlag(teamB?.name || teams[1]),',
        1
    )

    s = (
        s[:live_start] +
        block +
        s[live_end:]
    )

# ============================================================
# 10. UPCOMING:
#     TRUST /upcoming + MATCH FALLBACK + 120 DAYS
# ============================================================

old_source = '''        const upcomingSource =
          upcomingRows.length > 0
            ? upcomingRows
            : matchRows;'''

new_source = '''        const upcomingSource = unique([
          ...upcomingRows,
          ...matchRows.filter(upcoming)
        ]);'''

if old_source in s:
    s = s.replace(
        old_source,
        new_source,
        1
    )

s = s.replace(
    "/* Only upcoming matches in the next 30 days. */",
    "/* Show genuine upcoming matches for next 120 days. */",
    1
)

s = s.replace(
    "30 * 24 * 60 * 60 * 1000",
    "120 * 24 * 60 * 60 * 1000",
    1
)

done("UPCOMING 120-DAY DATA FIXED")

# ============================================================
# 11. UPCOMING SERIES + TEAM LOGOS
# ============================================================

up_start = s.find(
    "    const upcomingAdapter = (m, index) => {"
)

up_end = s.find(
    "    const resultAdapter = (m, index) => {",
    up_start
)

if up_start >= 0 and up_end > up_start:
    up = s[up_start:up_end]

    if "BATZO_UPCOMING_SERIES_FINAL" not in up:
        anchor = '''      } catch (_) {}

      return {'''

        addition = '''      } catch (_) {}

      /* BATZO_UPCOMING_SERIES_FINAL */
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
              m?.matchType || "MATCH"
            ).toUpperCase();

      return {'''

        if anchor in up:
            up = up.replace(
                anchor,
                addition,
                1
            )

    if "aImg:" not in up:
        up = up.replace(
            '        af: "🏏",',
            '''        af: batzoTeamFlag(a),
        aImg: metaA?.img || "",''',
            1
        )
    else:
        up = up.replace(
            '        af: "🏏",',
            '        af: batzoTeamFlag(a),',
            1
        )

    if "bImg:" not in up:
        up = up.replace(
            '        bf: "🏏",',
            '''        bf: batzoTeamFlag(b),
        bImg: metaB?.img || "",''',
            1
        )
    else:
        up = up.replace(
            '        bf: "🏏",',
            '        bf: batzoTeamFlag(b),',
            1
        )

    if "        series: seriesName," not in up:
        up = up.replace(
            '        status: "UPCOMING",',
            '''        series: seriesName,
        matchLine,
        venue: m?.venue || "",
        status: "UPCOMING",''',
            1
        )

    s = (
        s[:up_start] +
        up +
        s[up_end:]
    )

    done("UPCOMING SERIES + LOGOS FIXED")

# ============================================================
# 12. SERIES / WOMEN FILTERS
# ============================================================

s = s.replace(
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
    1
)

s = s.replace(
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
    1
)

# UI wording only; internal value stays "league".
s = s.replace(
    "\n                League\n",
    "\n                Series\n",
    1
)

# ============================================================
# 13. RESULT -> COMPLETE
# ============================================================

s = s.replace(
    "\n                RESULT\n",
    "\n                COMPLETE\n",
    1
)

s = s.replace(
    ': "RECENT RESULTS"}',
    ': "COMPLETED MATCHES"}',
    1
)

s = s.replace(
    ': "No recent results available"}',
    ': "No completed matches available"}',
    1
)

done("COMPLETE MATCH TAB FIXED")

# ============================================================
# 14. REMOVE OLD DUPLICATE WALLET OBSERVER/HANDLERS
# ============================================================

v1 = s.find(
    "/* ===== BATZO_WALLET_BUTTON_BRIDGE_V1"
)

v2_end_marker = (
    "/* ===== END BATZO WALLET UI ACTION FIX V2 ===== */"
)

if v1 >= 0:
    v2_end = s.find(
        v2_end_marker,
        v1
    )

    if v2_end >= 0:
        v2_end += len(v2_end_marker)

        s = (
            s[:v1] +
            "\n" +
            s[v2_end:]
        )

        done("OLD WALLET OBSERVER REMOVED")

# ============================================================
# 15. ONE CLEAN WALLET ACTION HANDLER — NO OBSERVER
# ============================================================

wallet_marker = (
    "BATZO_WALLET_ACTION_CLEAN_FINAL"
)

if wallet_marker not in s:
    s += r'''

/* ===== BATZO_WALLET_ACTION_CLEAN_FINAL ===== */
if (
  typeof window !== "undefined" &&
  !window.__BATZO_WALLET_ACTION_CLEAN_FINAL__
) {
  window.__BATZO_WALLET_ACTION_CLEAN_FINAL__ = true;

  document.addEventListener(
    "click",
    async function(event) {
      const button =
        event.target?.closest?.("button");

      if (!button) return;

      const label =
        String(button.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase();

      const isDeposit =
        label.includes("ADD MONEY");

      const isWithdraw =
        label.includes("WITHDRAW");

      if (!isDeposit && !isWithdraw) {
        return;
      }

      const wallet =
        document.querySelector(
          ".bz-wallet-page, .batzo-wallet-final"
        );

      if (!wallet) return;

      event.preventDefault();
      event.stopPropagation();

      if (
        typeof event.stopImmediatePropagation ===
        "function"
      ) {
        event.stopImmediatePropagation();
      }

      const raw =
        window.prompt(
          isDeposit
            ? "Enter amount to add (₹)"
            : "Enter winning amount to withdraw (₹)",
          isDeposit ? "100" : ""
        );

      if (raw === null) return;

      const amount =
        Number(
          String(raw)
            .replace(/[₹,\s]/g, "")
        );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        window.alert(
          "Please enter a valid amount."
        );
        return;
      }

      button.disabled = true;

      try {
        const result =
          await batzoWalletRequest(
            isDeposit
              ? "/api/wallet/demo/deposit"
              : "/api/wallet/demo/withdraw",
            {
              method: "POST",
              body: JSON.stringify({
                amount
              })
            }
          );

        if (
          !result ||
          result.success !== true
        ) {
          throw new Error(
            result?.message ||
            "Wallet transaction failed."
          );
        }

        window.alert(
          result.message ||
          "Wallet updated successfully."
        );

        window.location.reload();

      } catch (error) {
        console.error(
          "[BATZO WALLET FINAL]",
          error
        );

        window.alert(
          error?.message ||
          "Wallet transaction failed."
        );

      } finally {
        button.disabled = false;
      }
    },
    true
  );
}
/* ===== END BATZO_WALLET_ACTION_CLEAN_FINAL ===== */

'''

    done("CLEAN WALLET ACTION INSTALLED")

# ============================================================
# FINAL VALIDATION
# ============================================================

checks = {
    "NO BROWSER HISTORY BACK":
        "window.history.back();" not in s,

    "BOTTOM TAB RESET":
        "BATZO_BOTTOM_TAB_BACK_HOME_FINAL" in s,

    "120 DAY UPCOMING":
        "120 * 24 * 60 * 60 * 1000" in s,

    "NO MATCH DROP":
        "const batzoWantedMatch = (m) =>\n      Boolean(m);" in s,

    "SERIES LABEL":
        "\n                Series\n" in s,

    "COMPLETE LABEL":
        "\n                COMPLETE\n" in s,

    "NO WALLET OBSERVER":
        "batzoWalletLogoutObserver" not in s,

    "CLEAN WALLET":
        wallet_marker in s
}

failed = [
    name
    for name, passed in checks.items()
    if not passed
]

if failed:
    print("FAILED:", ", ".join(failed))
    raise SystemExit(
        "ERROR: FINAL SOURCE VALIDATION FAILED"
    )

APP.write_text(s)
AUTH.write_text(auth)
NAV.write_text(nav)

print("")
print("========================================")
print("✅ ALL SOURCE FIXES APPLIED")
print("========================================")
