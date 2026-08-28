import { pushScreen, replaceScreen, backScreen, clearNavigation, recordScreen, initBatzoNavigation } from "./core/batzo-navigation-controller.js";
import BatzoPlayerShowcase from './BatzoPlayerShowcase';
import { BATZO_PLAYERS, BATZO_CONTESTS, openBatzoTeam, openBatzoContest } from "./batzo-flow.js";
import React, {
  useMemo,
  useState,
  useEffect,
  useRef
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import "./App.css";
import { installJoinFlow } from "./services/join-flow-ui";

const liveMatches = [
  {
    id: 1,
    league: "T20",
    a: "India",
    ac: "IND",
    af: "🇮🇳",
    as: "168/4",
    b: "Australia",
    bc: "AUS",
    bf: "🇦🇺",
    bs: "142/7",
    over: "17.2 ov",
    viewers: "2.1L people watching"
  }
];

const upcomingMatches = [
  {
    id: 2,
    league: "T20",
    a: "India",
    ac: "IND",
    af: "🇮🇳",
    b: "Australia",
    bc: "AUS",
    bf: "🇦🇺",
    time: "Today",
    clock: "7:30 PM"
  },
  {
    id: 3,
    league: "T20",
    a: "Pakistan",
    ac: "PAK",
    af: "🇵🇰",
    b: "New Zealand",
    bc: "NZ",
    bf: "🇳🇿",
    time: "Tomorrow",
    clock: "3:30 PM"
  },
  {
    id: 4,
    league: "T20",
    a: "England",
    ac: "ENG",
    af: "🏴",
    b: "South Africa",
    bc: "SA",
    bf: "🇿🇦",
    time: "Tomorrow",
    clock: "7:30 PM"
  }
];

const contests = [
  { title: "Mega Contest", prize: "₹50 Lakhs", entry: "₹49", spots: "2.1L" },
  { title: "Head To Head", prize: "₹1,800", entry: "₹49", spots: "2" },
  { title: "Small Contest", prize: "₹25,000", entry: "₹99", spots: "1,000" }
];

function Logo() {
  return (
    <div className="logo-area">
      <img
        src="/batzo-assets/Batzo-3D-Header-Logo.png?v=14"
        className="batzo-final-header-logo"
        alt="BATZO Cricket Hub"
      />
    </div>
  );
}

function Header({ setNotice }) {
  return (
    <header className="top-header">
      <Logo />

      <div className="header-right">
        <button
          className="notification-btn"
          onClick={() => setNotice("No new notifications")}
          aria-label="Notifications"
        >
          <span className="bell">♧</span>
          <b>3</b>
        </button>

        <button
          className="wallet-box"
          onClick={() => setNotice("Wallet balance: ₹0")}
        >
          <span className="wallet-icon">▰</span>
          <div>
            <small>Wallet Balance</small>
            <strong>₹0</strong>
          </div>
          <em>›</em>
        </button>
      </div>
    </header>
  );
}

function QuickCard({ icon, title, sub, type, onClick }) {
  return (
    <button className={`quick-card ${type || ""}`} onClick={onClick}>
      <div className="quick-icon">{icon}</div>
      <div className="quick-title">{title}</div>
      <div className="quick-sub">{sub}</div>
      <span className="quick-arrow">›</span>
    </button>
  );
}

function LiveMatchCard({ match, onOpen }) {
  return (
    <button className="live-match-card" onClick={() => onOpen(match)}>
      <div className="live-card-top">
        <span><i className="red-dot"></i> LIVE • {match.league}</span>
        <b>◉ LIVE</b>
      </div>

      <div className="live-score-row">
        <div className="side-team">
          <div className="flag">{match.af}</div>
          <div>
            <strong>{match.ac}</strong>
            <small>{match.a}</small>
          </div>
        </div>

        <div className="score">
          <strong>{match.as}</strong>
          <small>{match.over}</small>
        </div>

        <div className="versus">VS</div>

        <div className="score right-score">
          <strong>{match.bs}</strong>
          <small></small>
        </div>

        <div className="side-team right-team">
          <div>
            <strong>{match.bc}</strong>
            <small>{match.b}</small>
          </div>
          <div className="flag">{match.bf}</div>
        </div>
      </div>

      <div className="live-bottom">
        <div className="watching">
          <span>●</span>
          <b>{match.viewers}</b>
        </div>
        <span className="view-button">VIEW MATCH <b>→</b></span>
      </div>
    </button>
  );
}

function UpcomingCard({ match, onOpen }) {
  return (
    <button className="upcoming-card" onClick={() => onOpen(match)}>
      <div className="up-team">
        <span className="mini-flag">{match.af}</span>
        <div>
          <strong>{match.ac}</strong>
          <small>{match.a}</small>
        </div>
      </div>

      <div className="match-time-box">
        <span>{match.time}</span>
        <strong>{match.clock}</strong>
      </div>

      <div className="up-team away">
        <div>
          <strong>{match.bc}</strong>
          <small>{match.b}</small>
        </div>
        <span className="mini-flag">{match.bf}</span>
      </div>

      <span className="contest-action">VIEW CONTESTS <b>→</b></span>
    </button>
  );
}

function ContestCard({ contest, onClick }) {
  return (
    <button className="contest-card" onClick={onClick}>
      <div>
        <small>WINNING PRIZE</small>
        <strong>{contest.prize}</strong>
      </div>
      <div className="contest-info">
        <b>{contest.title}</b>
        <span>{contest.spots} spots</span>
      </div>
      <div className="join-box">
        <small>JOIN</small>
        <b>{contest.entry}</b>
      </div>
    </button>
  );
}


/* BATZO_PHASE18_TEAM_MIGRATION */
(function(){
  try {
    const keys = [
      "batzo_active_team",
      "batzo_saved_team",
      "batzo_selected_team",
      "batzo_pending_team"
    ];

    let team = null;

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);

        if (
          parsed &&
          typeof parsed === "object" &&
          (
            Array.isArray(parsed.players) ||
            Array.isArray(parsed.playerIds) ||
            parsed.captain !== undefined ||
            parsed.viceCaptain !== undefined
          )
        ) {
          team = parsed;
          break;
        }
      } catch (_) {}
    }

    if (team) {
      const serialized = JSON.stringify(team);

      [
        "batzo_active_team",
        "batzo_selected_team",
        "batzo_pending_team"
      ].forEach(function(key){
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, serialized);
        }
      });

      window.BATZO_ACTIVE_TEAM = team;
      window.BATZO_PENDING_TEAM = team;

      console.log("PHASE 18: EXISTING TEAM MIGRATED");
    }
  } catch (error) {
    console.warn(
      "BATZO PHASE 18 team migration:",
      error
    );
  }
})();

function App() {
  const [tab, setTab] = useState("home");

  /*
   * BATZO CLEAN TAB + ANDROID BACK NAVIGATION
   * IMPORTANT: this code is AFTER tab declaration.
   */
  const batzoTabHistory = useRef([]);
  const batzoPreviousTab = useRef(tab);

  useEffect(() => {
    let active = true;
    let handle = null;

    const onBack = async () => {
      if (!active) return;

      try {
        /* Custom Batzo flow gets first priority. */
        if (
          typeof window.__BATZO_FLOW_BACK__ === "function" &&
          window.__BATZO_FLOW_BACK__() === true
        ) {
          return;
        }

        /* Normal React tab history. */
        if (batzoTabHistory.current.length > 0) {
          const previous = batzoTabHistory.current.pop();
          batzoPreviousTab.current = previous;
          setTab(previous);
          return;
        }

        /* Any non-home tab returns to Home. */
        if (tab !== "home") {
          batzoPreviousTab.current = "home";
          setTab("home");
          return;
        }

        /* At Home there is nothing inside Batzo to go back to.
           Let Android handle the final exit. */
      } catch (error) {
        console.warn("BATZO Android Back:", error);
      }
    };

    import("@capacitor/app").then(({ App }) => {
      if (!active) return;

      App.addListener("backButton", onBack).then((h) => {
        if (active) {
          handle = h;
          window.__BATZO_BACK_HANDLE__ = h;
        } else {
          h.remove();
        }
      });
    }).catch((error) => {
      console.warn("BATZO Back listener:", error);
    });

    return () => {
      active = false;

      if (handle) {
        handle.remove();
        handle = null;
      }

      if (window.__BATZO_BACK_HANDLE__) {
        window.__BATZO_BACK_HANDLE__.remove();
        window.__BATZO_BACK_HANDLE__ = null;
      }
    };
  }, [tab]);


  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const openMatch = (match) => {
    try {
      // Preserve the exact match selected by the user.
      window.BATZO_ACTIVE_MATCH = match;

      try {
        localStorage.setItem(
          "batzo_selected_match",
          JSON.stringify(match)
        );
      } catch (e) {
        console.warn("BATZO selected match storage:", e);
      }

      // Open the existing contest tab with the selected match context.
      setSelectedMatch?.(match);
      setTab("contests");
    } catch (e) {
      console.warn("BATZO match -> contest flow:", e);
      setTab("contests");
    }
  };

  const upcomingFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return upcomingMatches;

    return upcomingMatches.filter((m) =>
      `${m.a} ${m.b} ${m.ac} ${m.bc} ${m.league}`
        .toLowerCase()
        .includes(q)
    );
  }, [search]);

  const showComing = (name) => {
    // BATZO CONTEST NAVIGATION FIX
    // Popular / Complete must open the real contest screen.
    setNotice("");
    setTab("contests");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Open the existing contest renderer when available.
    setTimeout(() => {
      try {
        if (typeof showContest === "function") {
          showContest();
        } else if (
          typeof window !== "undefined" &&
          typeof window.BATZO_ACTIVE_CONTEST !== "undefined"
        ) {
          window.dispatchEvent(
            new CustomEvent("batzo:contest", {
              detail: {
                contest: window.BATZO_ACTIVE_CONTEST
              }
            })
          );
        }
      } catch (e) {
        console.warn("BATZO contest navigation:", e);
      }
    }, 0);
  };

  const goHome = () => {
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="batzo-app">
      <Header setNotice={setNotice} />

      <main className="main-content">
      <BatzoPlayerShowcase />

        {notice && (
          <button className="notice-bar" onClick={() => setNotice("")}>
            <span>{notice}</span>
            <b>×</b>
          </button>
        )}

        {tab === "home" && (
          <>
            <section className="hero-banner">
              <div className="hero-copy">
                <span className="hero-kicker">THE NEW CRICKET EXPERIENCE</span>
                <h1>
                  Play smart.<br />
                  <span>Play Batzo.</span>
                </h1>
                <p>
                  Create your best XI, join contests
                  <br />
                  and follow every ball.
                </p>
                <button
                  className="hero-button"
                  onClick={() => setTab("matches")}
                >
                  EXPLORE MATCHES <b>→</b>
                </button>
              </div>

              <div className="hero-cricket">
                <div className="stadium-lights">✦ ✦</div>
                <div className="cricket-ring ring-one"></div>
                <div className="cricket-ring ring-two"></div>
                <div className="cricket-player">🏏</div>
                <div className="cricket-ball">🏏</div>
              </div>

              <div className="hero-dots">
                <i className="active"></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </section>



            <section className="section-block batzo-hidden-home-section">
              <div className="section-heading">
                <div>
                  <span>PLAY NOW</span>
                  <h2>Live Matches</h2>
                </div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>

              {liveMatches.map((m) => (
                <LiveMatchCard
                  key={m.id}
                  match={m}
                  onOpen={openMatch}
                />
              ))}
            </section>

            <section className="section-block batzo-hidden-home-section">
              <div className="section-heading">
                <div>
                  <span>DON'T MISS OUT</span>
                  <h2>Upcoming Matches</h2>
                </div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>

              <div className="upcoming-list">
                {upcomingMatches.slice(0, 2).map((m) => (
                  <UpcomingCard
                    key={m.id}
                    match={m}
                    onOpen={openMatch}
                  />
                ))}
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span>TOP PICKS</span>
                  <h2>Popular Contests</h2>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent("batzo:open-contests"))}>View all →</button>
              </div>

              <div className="contest-list">
                {contests.map((c) => (
                  <ContestCard
                    key={c.title}
                    contest={c}
                    onClick={() => showComing(c.title)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "matches" && (
          <section className="matches-page">
            <div className="page-heading">
              <span>BATZO CRICKET</span>
              <h1>Matches</h1>
              <p>Choose a match and enter the action.</p>
            </div>

            <div className="search-field">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams or matches"
              />
            </div>

            <div className="match-section-title">LIVE</div>

            {liveMatches.map((m) => (
              <LiveMatchCard
                key={m.id}
                match={m}
                onOpen={openMatch}
              />
            ))}

            <div className="match-section-title upcoming-title">
              UPCOMING
            </div>

            <div className="upcoming-list">
              {upcomingFiltered.map((m) => (
                <UpcomingCard
                  key={m.id}
                  match={m}
                  onOpen={openMatch}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "contests" && (
          <section className="simple-page">
            <div className="page-heading">
              <span>COMPETE</span>
              <h1>Contests</h1>
              <p>Choose your contest and play your way.</p>
            </div>

            <div className="contest-list">
              {contests.map((c) => (
                <ContestCard
                  key={c.title}
                  contest={c}
                  onClick={() => showComing(c.title)}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "teams" && (
          <section className="empty-page">
            <div className="empty-icon">👥</div>
            <span>YOUR SQUADS</span>
            <h1>My Teams</h1>
            <p>Create and manage your fantasy cricket teams here.</p>
            <button
              className="hero-button"
              onClick={() => showComing("Team Builder")}
            >
              CREATE TEAM →
            </button>
          </section>
        )}

        {tab === "profile" && (
          <section className="empty-page">
            <div className="profile-icon">B</div>
            <span>BATZO ACCOUNT</span>
            <h1>Your Profile</h1>
            <p>Profile, wallet and account settings.</p>
            <button
              className="outline-button"
              onClick={() => showComing("Account Settings")}
            >
              ACCOUNT SETTINGS
            </button>
          </section>
        )}
      </main>

      <nav className="bottom-navigation">
        <button
          className={tab === "home" ? "active" : ""}
          onClick={goHome}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          className={tab === "matches" ? "active" : ""}
          onClick={() => setTab("matches")}
        >
          <span>🏏</span>
          <small>Matches</small>
        </button>

        <button
          className={tab === "contests" ? "active" : ""}
          onClick={() => setTab("contests")}
        >
          <span>🏆</span>
          <small>Contest</small>
        </button>

        <button
          className={tab === "teams" ? "active" : ""}
          onClick={() => setTab("teams")}
        >
          <span>👥</span>
          <small>My Team</small>
        </button>

        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => setTab("profile")}
        >
          <span>◉</span>
          <small>Profile</small>
        </button>
      </nav>
    </div>
  );
}


/* ==============================================================
   BATZO V11 CLEAN SINGLE FLOW
   Contest -> Details -> My Teams -> Team Builder -> C/VC -> Join
   ============================================================== */
(function () {
  "use strict";

  if (typeof window === "undefined") return;

  const TEAM_KEY = "batzo_v11_match_teams";
  const JOIN_KEY = "batzo_v11_joined_contests";
  const WALLET_KEY = "batzo_wallet_balance";

  const MAX_TEAMS = 10;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("BATZO storage error", e);
    }
  }

  function matchKey(match) {
    if (!match) return "IND-vs-AUS";

    if (typeof match === "string") {
      return match.replace(/[^a-zA-Z0-9_-]/g, "-");
    }

    return String(
      match.id ||
      match.matchId ||
      match.key ||
      ((match.a || match.teamA || "IND") + "-" +
       (match.b || match.teamB || "AUS"))
    ).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function currentMatch() {
    return window.BATZO_ACTIVE_MATCH || "IND vs AUS";
  }

  function getTeams(match) {
    const all = readJSON(TEAM_KEY, {});
    const key = matchKey(match);

    if (Array.isArray(all[key])) {
      return all[key];
    }

    return [];
  }

  function saveTeams(match, teams) {
    const all = readJSON(TEAM_KEY, {});
    all[matchKey(match)] = teams.slice(0, MAX_TEAMS);
    writeJSON(TEAM_KEY, all);
  }

  function getContests() {
    try {
      if (
        typeof BATZO_CONTESTS !== "undefined" &&
        Array.isArray(BATZO_CONTESTS) &&
        BATZO_CONTESTS.length
      ) {
        return BATZO_CONTESTS;
      }
    } catch (e) {}

    return [
      {
        id: "mega-001",
        name: "Mega Contest",
        prize: "₹1,00,000",
        entry: "₹49",
        spots: 10000,
        joined: 3210,
        type: "popular"
      },
      {
        id: "grand-002",
        name: "Grand Contest",
        prize: "₹50,000",
        entry: "₹99",
        spots: 5000,
        joined: 1800,
        type: "popular"
      },
      {
        id: "small-003",
        name: "Small Contest",
        prize: "₹5,000",
        entry: "₹25",
        spots: 500,
        joined: 210,
        type: "complete"
      }
    ];
  }

  function players() {
    try {
      if (
        typeof BATZO_PLAYERS !== "undefined" &&
        Array.isArray(BATZO_PLAYERS) &&
        BATZO_PLAYERS.length
      ) {
        return BATZO_PLAYERS;
      }
    } catch (e) {}

    return [];
  }

  function root() {
    return document.getElementById("root");
  }

  function shell(title, subtitle, body, backText) {
    const r = root();
    if (!r) return;

    r.innerHTML = `
      <div class="bz-flow-screen" style="
        min-height:100vh;
        background:#07100d;
        color:#fff;
        padding-bottom:90px;
      ">
        <div style="
          position:sticky;
          top:0;
          z-index:20;
          background:#07100d;
          padding:16px;
          border-bottom:1px solid rgba(255,255,255,.08);
        ">
          <button id="bzV11Back" type="button" style="
            border:0;
            background:transparent;
            color:#fff;
            font-size:15px;
            margin-bottom:10px;
          ">← ${backText || "Back"}</button>

          <div style="
            font-size:11px;
            font-weight:900;
            letter-spacing:2px;
            color:#24e778;
          ">BATZO CRICKET</div>

          <h1 style="margin:5px 0 0;font-size:25px">${title}</h1>

          <div style="
            margin-top:5px;
            color:#929aa7;
            font-size:13px;
          ">${subtitle || ""}</div>
        </div>

        <div style="padding:16px">${body}</div>
      </div>
    `;

    return r;
  }

  function goBack() {
    location.reload();
  }

  function showContestTabs(selected) {
    const list = getContests();
    const popular = list.filter(
      c => String(c.type || "popular").toLowerCase() !== "complete"
    );
    const complete = list.filter(
      c => String(c.type || "").toLowerCase() === "complete"
    );

    const items = selected === "complete" ? complete : popular;

    const cards = items.length
      ? items.map(c => `
          <button
            type="button"
            class="bz-v11-contest-card"
            data-contest-id="${String(c.id || c.name).replace(/"/g,"&quot;")}"
            style="
              width:100%;
              text-align:left;
              margin:10px 0;
              padding:16px;
              border-radius:16px;
              border:1px solid rgba(255,255,255,.10);
              background:#101a16;
              color:#fff;
            "
          >
            <div style="display:flex;justify-content:space-between;gap:10px">
              <strong>${c.name || "Contest"}</strong>
              <span style="color:#24e778;font-weight:900">
                ${c.entry || "₹49"}
              </span>
            </div>

            <div style="
              margin-top:9px;
              font-size:13px;
              color:#9ca5b1;
            ">
              Prize ${c.prize || "₹0"} ·
              ${Number(c.spots || 0).toLocaleString("en-IN")} spots
            </div>

            <div style="
              margin-top:12px;
              font-size:12px;
              font-weight:900;
              color:#24e778;
            ">VIEW CONTEST →</div>
          </button>
        `).join("")
      : `
        <div style="
          padding:25px 10px;
          text-align:center;
          color:#9ca5b1;
        ">
          No contests available in this category.
        </div>
      `;

    const r = shell(
      "Contests",
      currentMatch(),
      `
        <div style="
          display:flex;
          gap:8px;
          margin-bottom:14px;
        ">
          <button id="bzPopular" type="button" style="
            flex:1;
            padding:12px;
            border-radius:12px;
            border:0;
            font-weight:900;
            background:${selected === "popular" ? "#24e778" : "#18231e"};
            color:${selected === "popular" ? "#061008" : "#fff"};
          ">POPULAR</button>

          <button id="bzComplete" type="button" style="
            flex:1;
            padding:12px;
            border-radius:12px;
            border:0;
            font-weight:900;
            background:${selected === "complete" ? "#24e778" : "#18231e"};
            color:${selected === "complete" ? "#061008" : "#fff"};
          ">COMPLETE</button>
        </div>

        <div>${cards}</div>
      `
    );

    r.querySelector("#bzV11Back").onclick = goBack;

    r.querySelector("#bzPopular").onclick = function () {
      showContestTabs("popular");
    };

    r.querySelector("#bzComplete").onclick = function () {
      showContestTabs("complete");
    };

    r.querySelectorAll("[data-contest-id]").forEach(function (btn) {
      btn.onclick = function () {
        const id = btn.getAttribute("data-contest-id");
        const contest = list.find(
          c => String(c.id || c.name) === String(id)
        ) || list[0];

        window.BATZO_ACTIVE_CONTEST = contest;
        showContestDetails(contest);
      };
    });
  }

  function showContestDetails(contest) {
    const match = currentMatch();

    const r = shell(
      contest.name || "Contest Details",
      match,
      `
        <div style="
          padding:18px;
          border-radius:18px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.10);
        ">
          <div style="
            font-size:12px;
            color:#24e778;
            font-weight:900;
            letter-spacing:1.5px;
          ">CONTEST DETAILS</div>

          <h2 style="margin:8px 0">
            ${contest.name || "Contest"}
          </h2>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-top:15px;
          ">
            <div>
              <small style="color:#8e97a3">PRIZE POOL</small>
              <div style="font-weight:900;margin-top:4px">
                ${contest.prize || "₹0"}
              </div>
            </div>

            <div>
              <small style="color:#8e97a3">ENTRY</small>
              <div style="font-weight:900;margin-top:4px">
                ${contest.entry || "₹49"}
              </div>
            </div>

            <div>
              <small style="color:#8e97a3">SPOTS</small>
              <div style="font-weight:900;margin-top:4px">
                ${Number(contest.spots || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <small style="color:#8e97a3">JOINED</small>
              <div style="font-weight:900;margin-top:4px">
                ${Number(contest.joined || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:16px">
          <button id="bzV11Teams" type="button" style="
            width:100%;
            padding:15px;
            border:0;
            border-radius:13px;
            background:#18231e;
            color:#fff;
            font-weight:900;
          ">MY TEAMS (${getTeams(match).length}/10)</button>

          <button id="bzV11Create" type="button" style="
            width:100%;
            margin-top:10px;
            padding:15px;
            border:0;
            border-radius:13px;
            background:#24e778;
            color:#061008;
            font-weight:900;
          ">CREATE TEAM</button>
        </div>
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showContestTabs(
        String(contest.type || "popular").toLowerCase() === "complete"
          ? "complete"
          : "popular"
      );
    };

    r.querySelector("#bzV11Teams").onclick = function () {
      showMyTeams(match, contest);
    };

    r.querySelector("#bzV11Create").onclick = function () {
      showTeamBuilder(match, contest, null);
    };
  }

  function showMyTeams(match, contest) {
    const teams = getTeams(match);

    const list = teams.length
      ? teams.map(function (team, index) {
          return `
            <div style="
              margin:10px 0;
              padding:15px;
              border-radius:15px;
              background:#101a16;
              border:1px solid rgba(255,255,255,.10);
            ">
              <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:8px;
              ">
                <strong>${team.name || "Team " + (index + 1)}</strong>

                <span style="
                  font-size:11px;
                  color:#24e778;
                  font-weight:900;
                ">
                  ${Array.isArray(team.players) ? team.players.length : 0}/11
                </span>
              </div>

              <div style="
                margin-top:7px;
                font-size:12px;
                color:#929aa7;
              ">
                ${team.captainName ? "C: " + team.captainName : "C not selected"}
                ·
                ${team.viceCaptainName ? "VC: " + team.viceCaptainName : "VC not selected"}
              </div>

              <div style="
                display:flex;
                gap:7px;
                margin-top:12px;
              ">
                <button
                  type="button"
                  data-select="${team.id}"
                  style="
                    flex:1;
                    padding:10px;
                    border:0;
                    border-radius:10px;
                    background:#24e778;
                    color:#061008;
                    font-weight:900;
                  "
                >SELECT</button>

                <button
                  type="button"
                  data-edit="${team.id}"
                  style="
                    padding:10px 14px;
                    border:1px solid rgba(255,255,255,.15);
                    border-radius:10px;
                    background:#18231e;
                    color:#fff;
                    font-weight:900;
                  "
                >EDIT</button>

                <button
                  type="button"
                  data-delete="${team.id}"
                  style="
                    padding:10px 14px;
                    border:1px solid rgba(255,255,255,.15);
                    border-radius:10px;
                    background:#18231e;
                    color:#fff;
                    font-weight:900;
                  "
                >DELETE</button>
              </div>
            </div>
          `;
        }).join("")
      : `
        <div style="
          text-align:center;
          padding:30px 10px;
          color:#929aa7;
        ">
          No team created for this match yet.
        </div>
      `;

    const r = shell(
      "My Teams",
      match + " • " + (contest.name || "Contest"),
      `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:12px;
        ">
          <strong>My Teams</strong>
          <span style="color:#24e778;font-weight:900">
            ${teams.length}/10
          </span>
        </div>

        ${list}

        ${
          teams.length < MAX_TEAMS
            ? `
              <button id="bzCreateAnother" type="button" style="
                width:100%;
                margin-top:10px;
                padding:14px;
                border:0;
                border-radius:12px;
                background:#24e778;
                color:#061008;
                font-weight:900;
              ">+ CREATE NEW TEAM</button>
            `
            : `
              <div style="
                text-align:center;
                padding:12px;
                color:#24e778;
                font-size:12px;
                font-weight:900;
              ">MAXIMUM 10 TEAMS REACHED</div>
            `
        }

        ${
          teams.length
            ? `
              <button id="bzContinueSelected" type="button" style="
                width:100%;
                margin-top:10px;
                padding:14px;
                border:0;
                border-radius:12px;
                background:#18231e;
                color:#fff;
                font-weight:900;
              ">CONTINUE WITH SELECTED TEAM</button>
            `
            : ""
        }
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showContestDetails(contest);
    };

    const create = r.querySelector("#bzCreateAnother");
    if (create) {
      create.onclick = function () {
        if (getTeams(match).length >= MAX_TEAMS) {
          alert("Maximum 10 teams allowed for this match.");
          return;
        }
        showTeamBuilder(match, contest, null);
      };
    }

    r.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.onclick = function () {
        const team = getTeams(match).find(
          t => String(t.id) === String(btn.dataset.edit)
        );

        if (team) {
          showTeamBuilder(match, contest, team);
        }
      };
    });

    r.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.onclick = function () {
        const id = btn.dataset.delete;

        if (!confirm("Delete this team?")) return;

        const next = getTeams(match).filter(
          t => String(t.id) !== String(id)
        );

        saveTeams(match, next);
        showMyTeams(match, contest);
      };
    });

    r.querySelectorAll("[data-select]").forEach(function (btn) {
      btn.onclick = function () {
        localStorage.setItem(
          "batzo_v11_selected_team",
          JSON.stringify({
            match: matchKey(match),
            teamId: btn.dataset.select
          })
        );

        showMyTeams(match, contest);
      };
    });

    const cont = r.querySelector("#bzContinueSelected");

    if (cont) {
      cont.onclick = function () {
        const selected = readJSON("batzo_v11_selected_team", null);

        if (!selected || selected.match !== matchKey(match)) {
          alert("Please select a team first.");
          return;
        }

        const team = getTeams(match).find(
          t => String(t.id) === String(selected.teamId)
        );

        if (!team) {
          alert("Selected team not found.");
          return;
        }

        showJoinConfirmation(match, contest, team);
      };
    }
  }

  function showTeamBuilder(match, contest, editing) {
    const ps = players();

    if (!ps.length) {
      alert("Player list is not available.");
      return;
    }

    const existing = editing || {};
    const selectedPlayers = Array.isArray(existing.players)
      ? existing.players
      : [];

    const selectedNames = new Set(
      selectedPlayers.map(p => String(p.id || p.name))
    );

    const cards = ps.map(function (p, i) {
      const id = String(p.id || p.name || i);
      const active = selectedNames.has(id);

      return `
        <button
          type="button"
          class="bz-player"
          data-player-id="${id.replace(/"/g,"&quot;")}"
          style="
            width:100%;
            text-align:left;
            padding:12px;
            margin:6px 0;
            border-radius:12px;
            border:1px solid ${active ? "#24e778" : "rgba(255,255,255,.10)"};
            background:${active ? "#14291d" : "#101a16"};
            color:#fff;
          "
        >
          <strong>${p.name || "Player " + (i + 1)}</strong>
          <div style="
            margin-top:4px;
            font-size:11px;
            color:#929aa7;
          ">
            ${p.team || ""} · ${p.role || ""}
            ${p.credit ? " · " + p.credit + " Credits" : ""}
          </div>
        </button>
      `;
    }).join("");

    const r = shell(
      editing ? "Edit Team" : "Create Team",
      match + " • Select exactly 11 players",
      `
        <div style="
          position:sticky;
          top:98px;
          z-index:10;
          padding:12px;
          border-radius:12px;
          background:#101a16;
          margin-bottom:10px;
        ">
          <strong id="bzPlayerCount">
            SELECTED: ${selectedPlayers.length}/11
          </strong>
        </div>

        <div id="bzPlayerList">${cards}</div>

        <button id="bzTeamNext" type="button" style="
          width:100%;
          margin-top:12px;
          padding:15px;
          border:0;
          border-radius:13px;
          background:#24e778;
          color:#061008;
          font-weight:900;
        ">
          CONTINUE • ${selectedPlayers.length}/11
        </button>
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showMyTeams(match, contest);
    };

    const selected = new Map();

    selectedPlayers.forEach(function (p) {
      selected.set(String(p.id || p.name), p);
    });

    function refresh() {
      const n = selected.size;

      r.querySelector("#bzPlayerCount").textContent =
        "SELECTED: " + n + "/11";

      r.querySelector("#bzTeamNext").textContent =
        "CONTINUE • " + n + "/11";

      r.querySelectorAll(".bz-player").forEach(function (b) {
        const on = selected.has(b.dataset.playerId);

        b.style.borderColor = on
          ? "#24e778"
          : "rgba(255,255,255,.10)";

        b.style.background = on
          ? "#14291d"
          : "#101a16";
      });
    }

    r.querySelectorAll(".bz-player").forEach(function (btn) {
      btn.onclick = function () {
        const id = btn.dataset.playerId;

        if (selected.has(id)) {
          selected.delete(id);
        } else {
          if (selected.size >= 11) {
            alert("Maximum 11 players.");
            return;
          }

          const p = ps.find(
            x => String(x.id || x.name) === id
          );

          if (p) selected.set(id, p);
        }

        refresh();
      };
    });

    r.querySelector("#bzTeamNext").onclick = function () {
      if (selected.size !== 11) {
        alert("Please select exactly 11 players.");
        return;
      }

      showCaptainVC(
        match,
        contest,
        editing,
        Array.from(selected.values())
      );
    };
  }

  function showCaptainVC(match, contest, editing, selectedPlayers) {
    let captain = editing ? editing.captain : null;
    let vice = editing ? editing.viceCaptain : null;

    const rows = selectedPlayers.map(function (p, i) {
      const id = String(p.id || p.name || i);

      return `
        <div style="
          margin:8px 0;
          padding:13px;
          border-radius:13px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.10);
        ">
          <strong>${p.name || "Player"}</strong>

          <div style="
            display:flex;
            gap:8px;
            margin-top:10px;
          ">
            <button
              type="button"
              data-c="${id.replace(/"/g,"&quot;")}"
              style="
                padding:10px 15px;
                border-radius:9px;
                border:0;
                background:${String(captain) === id ? "#24e778" : "#18231e"};
                color:#fff;
                font-weight:900;
              "
            >C</button>

            <button
              type="button"
              data-vc="${id.replace(/"/g,"&quot;")}"
              style="
                padding:10px 15px;
                border-radius:9px;
                border:0;
                background:${String(vice) === id ? "#24e778" : "#18231e"};
                color:#fff;
                font-weight:900;
              "
            >VC</button>
          </div>
        </div>
      `;
    }).join("");

    const r = shell(
      "Captain & Vice-Captain",
      "Choose one C and one VC",
      `
        ${rows}

        <button id="bzSaveTeam" type="button" style="
          width:100%;
          margin-top:12px;
          padding:15px;
          border:0;
          border-radius:13px;
          background:#24e778;
          color:#061008;
          font-weight:900;
        ">SAVE TEAM</button>
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showTeamBuilder(match, contest, editing);
    };

    r.querySelectorAll("[data-c]").forEach(function (btn) {
      btn.onclick = function () {
        captain = btn.dataset.c;
        refreshButtons();
      };
    });

    r.querySelectorAll("[data-vc]").forEach(function (btn) {
      btn.onclick = function () {
        vice = btn.dataset.vc;
        refreshButtons();
      };
    });

    function refreshButtons() {
      r.querySelectorAll("[data-c]").forEach(function (b) {
        b.style.background =
          String(captain) === b.dataset.c
            ? "#24e778"
            : "#18231e";
      });

      r.querySelectorAll("[data-vc]").forEach(function (b) {
        b.style.background =
          String(vice) === b.dataset.vc
            ? "#24e778"
            : "#18231e";
      });
    }

    r.querySelector("#bzSaveTeam").onclick = function () {
      if (captain === null || captain === undefined) {
        alert("Please select Captain.");
        return;
      }

      if (vice === null || vice === undefined) {
        alert("Please select Vice-Captain.");
        return;
      }

      if (String(captain) === String(vice)) {
        alert("Captain and Vice-Captain must be different.");
        return;
      }

      const all = getTeams(match);

      const captainPlayer = selectedPlayers.find(
        p => String(p.id || p.name) === String(captain)
      );

      const vicePlayer = selectedPlayers.find(
        p => String(p.id || p.name) === String(vice)
      );

      const team = {
        id: editing && editing.id
          ? editing.id
          : "team-" + Date.now() + "-" + Math.random().toString(36).slice(2,7),

        name: editing && editing.name
          ? editing.name
          : "Team " + (all.length + 1),

        players: selectedPlayers,

        captain: captain,
        viceCaptain: vice,

        captainName: captainPlayer
          ? captainPlayer.name
          : "",

        viceCaptainName: vicePlayer
          ? vicePlayer.name
          : "",

        updatedAt: Date.now()
      };

      let next;

      if (editing) {
        next = all.map(function (x) {
          return String(x.id) === String(editing.id)
            ? team
            : x;
        });
      } else {
        if (all.length >= MAX_TEAMS) {
          alert("Maximum 10 teams allowed for this match.");
          return;
        }

        next = all.concat(team);
      }

      saveTeams(match, next);

      localStorage.setItem(
        "batzo_v11_selected_team",
        JSON.stringify({
          match: matchKey(match),
          teamId: team.id
        })
      );

      showMyTeams(match, contest);
    };
  }

  function walletBalance() {
    const n = Number(localStorage.getItem(WALLET_KEY));
    return Number.isFinite(n) ? n : 0;
  }

  function entryAmount(contest) {
    const raw = String(contest.entry || "49");
    const n = Number(raw.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 49;
  }

  function showJoinConfirmation(match, contest, team) {
    const fee = entryAmount(contest);

    const r = shell(
      "Join Contest",
      match + " • " + (contest.name || "Contest"),
      `
        <div style="
          padding:18px;
          border-radius:17px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.10);
        ">
          <div style="color:#24e778;font-weight:900">
            SELECTED TEAM
          </div>

          <h2>${team.name || "My Team"}</h2>

          <div style="color:#929aa7;font-size:13px">
            ${team.players.length}/11 players
            · C: ${team.captainName || "-"}
            · VC: ${team.viceCaptainName || "-"}
          </div>

          <div style="
            margin-top:18px;
            display:flex;
            justify-content:space-between;
          ">
            <span>Entry Fee</span>
            <strong>₹${fee}</strong>
          </div>

          <div style="
            margin-top:8px;
            display:flex;
            justify-content:space-between;
          ">
            <span>Wallet</span>
            <strong>₹${walletBalance()}</strong>
          </div>
        </div>

        <button id="bzFinalJoin" type="button" style="
          width:100%;
          margin-top:15px;
          padding:16px;
          border:0;
          border-radius:13px;
          background:#24e778;
          color:#061008;
          font-weight:900;
        ">
          JOIN CONTEST • ₹${fee}
        </button>
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showMyTeams(match, contest);
    };

    r.querySelector("#bzFinalJoin").onclick = function () {
      const joined = readJSON(JOIN_KEY, []);

      const duplicate = joined.some(function (x) {
        return String(x.contestId) === String(contest.id) &&
               String(x.match) === String(matchKey(match)) &&
               String(x.teamId) === String(team.id);
      });

      if (duplicate) {
        alert("This team is already joined in this contest.");
        return;
      }

      const balance = walletBalance();

      if (balance < fee) {
        alert(
          "Insufficient wallet balance. Required ₹" +
          fee +
          ", available ₹" +
          balance + "."
        );
        return;
      }

      const record = {
        contestId: contest.id || contest.name,
        contestName: contest.name || "Contest",
        match: matchKey(match),
        teamId: team.id,
        joinedAt: Date.now()
      };

      writeJSON(JOIN_KEY, joined.concat(record));

      if (balance > 0) {
        localStorage.setItem(
          WALLET_KEY,
          String(Math.max(0, balance - fee))
        );
      }

      alert("Contest joined successfully.");
      showContestDetails(contest);
    };
  }

  function openContests() {
    window.BATZO_ACTIVE_MATCH =
      window.BATZO_ACTIVE_MATCH || "IND vs AUS";

    showContestTabs("popular");
  }

  function openMyTeams() {
    const match = currentMatch();

    const contests = getContests();

    showMyTeams(
      match,
      window.BATZO_ACTIVE_CONTEST || contests[0]
    );
  }

  /*
   * Capture ONLY the navigation buttons that belong to the
   * main React shell. This replaces the old competing listeners.
   */
  document.addEventListener("click", function (e) {
    const el = e.target.closest("button,a");
    if (!el) return;

    const text = (el.innerText || "").trim().toUpperCase();

    // Home -> Popular Contests card
    const popularSection = el.closest(".section-block");
    if (
      popularSection &&
      /Popular Contests/i.test(
        popularSection.innerText || ""
      ) &&
      el.closest(".contest-list")
    ) {
      const title = (el.innerText || "").trim();
      const contest = getContests().find(function (c) {
        return String(c.title || c.name || "").toUpperCase()
          === title.toUpperCase();
      }) || getContests()[0];

      if (contest) {
        e.preventDefault();
        e.stopPropagation();
        window.BATZO_ACTIVE_CONTEST = contest;
        showContestDetails(contest);
        return;
      }
    }

    if (text === "CONTEST" || text === "CONTESTS") {
      e.preventDefault();
      e.stopPropagation();
      openContests();
      return;
    }

    if (text.includes("CREATE TEAM")) {
      e.preventDefault();
      e.stopPropagation();

      const match = currentMatch();
      const contest =
        window.BATZO_ACTIVE_CONTEST ||
        getContests()[0];

      showTeamBuilder(match, contest, null);
      return;
    }

    if (
      text === "MY TEAM" ||
      text === "MY TEAMS"
    ) {
      e.preventDefault();
      e.stopPropagation();
      openMyTeams();
      return;
    }

    if (text === "POPULAR CONTEST" || text === "POPULAR CONTESTS") {
      e.preventDefault();
      e.stopPropagation();
      openContests();
      return;
    }

    if (text === "COMPLETE CONTEST" || text === "COMPLETE CONTESTS") {
      e.preventDefault();
      e.stopPropagation();
      showContestTabs("complete");
      return;
    }
  }, true);

  window.addEventListener("batzo:open-contests", openContests);

  window.addEventListener("batzo:contest", function (e) {
    const c =
      e.detail && e.detail.contest
        ? e.detail.contest
        : getContests()[0];

    window.BATZO_ACTIVE_CONTEST = c;
    showContestDetails(c);
  });

  window.addEventListener("batzo:team", function (e) {
    const match =
      e.detail && e.detail.match
        ? e.detail.match
        : currentMatch();

    window.BATZO_ACTIVE_MATCH = match;
    openMyTeams();
  });

})();

export default App;
