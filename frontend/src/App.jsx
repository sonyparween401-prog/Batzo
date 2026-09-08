import { pushScreen, replaceScreen, backScreen, clearNavigation, recordScreen, initBatzoNavigation } from "./core/batzo-navigation-controller.js";
import BatzoPlayerShowcase from './BatzoPlayerShowcase';
import React, {
  useMemo,
  useState,
  useEffect,
  useRef
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { GoogleAuthProvider, RecaptchaVerifier, signInWithPopup, linkWithPopup, signInWithPhoneNumber, linkWithPhoneNumber as webLinkWithPhoneNumber, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import "./App.css";
import { installJoinFlow } from "./services/join-flow-ui";

import AuthGate from "./AuthGate";
import { getLiveMatches } from "./services/cricketService.js";

/* BATZO_TEAM_FLAG_HELPER_FINAL_V3 */
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

function batzoLiveAdapter(m) {
  const teams = Array.isArray(m?.teams) ? m.teams : [];
  const info = Array.isArray(m?.teamInfo) ? m.teamInfo : [];
  const score = Array.isArray(m?.score) ? m.score : [];

  const teamA = info[0] || {};
  const teamB = info[1] || {};

  /* BATZO_MATCH_LIST_ADAPTER_V1 */
  const matchName = String(m?.name || "");
  const nameParts = matchName
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const seriesName =
    nameParts.length >= 3
      ? nameParts.slice(2).join(", ")
      : String(m?.matchType || "Cricket").toUpperCase();

  const matchLine =
    nameParts.length >= 2
      ? nameParts[1]
      : String(m?.matchType || "Match").toUpperCase();

  const findTeamScore = (teamName, fallbackIndex) => {
    const needle = String(teamName || "").toLowerCase();

    const found = score.find((x) =>
      String(x?.inning || "")
        .toLowerCase()
        .includes(needle)
    );

    return found || score[fallbackIndex] || {};
  };

  const current =
    score.length > 0
      ? score[score.length - 1]
      : {};

  const scoreAObj = findTeamScore(
    teamA?.name || teams[0],
    0
  );

  const scoreBObj = findTeamScore(
    teamB?.name || teams[1],
    1
  );

  const scoreText = (x) =>
    x?.display
      ? String(x.display)
      : x?.r != null
      ? `${x.r}/${x.w ?? 0}`
      : "-";

  const code = (team, fallback) =>
    String(team?.shortname || fallback || "")
      .toUpperCase()
      .slice(0, 4);

  return {
    id: m?.id || `${m?.name || "match"}-${m?.date || ""}`,
    raw: m,
    status: "LIVE",
    statusText: m?.status || "LIVE",
    category: m?.batzoCategory || "",
    series: seriesName,
    matchLine,
    venue: m?.venue || "",
    league: m?.name || m?.matchType || "Cricket",

    a: teamA?.name || teams[0] || "Team A",
    ac: code(teamA, teams[0]),
    af: batzoTeamFlag(teamA?.name || teams[0]),
    aImg: teamA?.img || "",

    b: teamB?.name || teams[1] || "Team B",
    bc: code(teamB, teams[1]),
    bf: batzoTeamFlag(teamB?.name || teams[1]),
    bImg: teamB?.img || "",

    as: scoreText(scoreAObj),
    scoreA: scoreText(scoreAObj),
    overA:
      scoreAObj?.o != null
        ? `${scoreAObj.o} ov`
        : "",

    bs: scoreText(scoreBObj),
    scoreB: scoreText(scoreBObj),
    overB:
      scoreBObj?.o != null
        ? `${scoreBObj.o} ov`
        : "",

    over: current?.o != null
      ? `${current.o} ov`
      : "LIVE",

    viewers: "Live score",

    innings: {
      battingTeam: current?.inning || "",
      bowlingTeam: "",
      score: current?.r != null
        ? `${current.r}/${current.w ?? 0}`
        : "-",
      overs: current?.o != null
        ? String(current.o)
        : "-",
      runRate: "-",
      target: "-",
      need: m?.status || "Live score updating..."
    },

    batsmen: [],
    bowlers: [],
    recentBalls: [],
    lastUpdated: "Live API"
  };
}


const contests = [
  {
    id: "batzo-free-demo-home",
    title: "BATZO FREE DEMO CONTEST",
    name: "BATZO FREE DEMO CONTEST",
    prize: "FREE DEMO",
    entry: "₹0",
    entryFee: 0,
    spots: "100",
    type: "practice",
    practice: true,
    isDemo: true
  },
  {
    id: "contest-mega",
    title: "Mega Contest",
    prize: "₹50 Lakhs",
    entry: "₹49",
    spots: "2.1L"
  },
  {
    id: "contest-head",
    title: "Head To Head",
    prize: "₹1,800",
    entry: "₹49",
    spots: "2"
  },
  {
    id: "contest-small",
    title: "Small Contest",
    prize: "₹25,000",
    entry: "₹99",
    spots: "1,000"
  }
];

function Logo() {
// BATZO_NAVIGATION_BACK_HANDLER
React.useEffect(() => {
  const onPopState = () => {
    const path = window.location.hash.replace(/^#\/?/, "");
    const target =
      path.startsWith("contest") ? "matches" :
      path.startsWith("my-team") || path.startsWith("team") ? "team" :
      path.startsWith("wallet") ? "wallet" :
      path.startsWith("profile") ? "profile" :
      "home";

    if (typeof setTab === "function") {
      setTab(target);
    }
  };

  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}, []);

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
          onClick={() => navigateTab("notifications")}
          aria-label="Notifications"
        >
          <span>💰</span>
          <b>3</b>
        </button>

        
      </div>

      {/* BATZO_TOP_PROFILE_BUTTON_FINAL */}
      <button
        type="button"
        aria-label="Profile"
        title="Profile"
        onClick={() => {
          batzoTabHistory.current.push(tab);
          batzoPreviousTab.current = tab;
          setTab("profile");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{
          border:"1px solid rgba(50,245,138,.30)",
          borderRadius:"12px",
          background:"rgba(16,25,22,.90)",
          color:"#32f58a",
          padding:"8px 12px",
          fontWeight:"900",
          fontSize:"14px",
          marginLeft:"8px"
        }}
      >
        👤 Profile
      </button>
      {/* END BATZO_TOP_PROFILE_BUTTON_FINAL */}

</header>
  );
}



function BallByBallPanel({ match, completed = false }) {
  const [balls, setBalls] = useState([]);
  const [bbbLoading, setBbbLoading] = useState(false);
  const [bbbError, setBbbError] = useState("");
  const [bbbUpdated, setBbbUpdated] = useState("");
  const bbbBusyRef = useRef(false);

  const matchId =
    match?.id ||
    match?.raw?.id ||
    match?.matchId ||
    "";

  const apiBase =
    (import.meta.env.VITE_API_BASE_URL ||
      "https://batzo.onrender.com"
    ).replace(/\/+$/, "");

  const loadBallByBall = async () => {
    if (!matchId || bbbBusyRef.current) return;

    bbbBusyRef.current = true;
    setBbbLoading(true);
    setBbbError("");

    try {
      const response = await fetch(
        `${apiBase}/api/cricket/ball-by-ball/${encodeURIComponent(matchId)}`,
        {
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
          `HTTP ${response.status}`
        );
      }

      const rows = Array.isArray(payload?.balls)
        ? payload.balls
        : [];

      setBalls(rows);
      setBbbUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit"
        })
      );
    } catch (error) {
      console.warn(
        "BATZO ball-by-ball:",
        error
      );

      setBbbError(
        "Ball-by-ball data is not available right now."
      );
    } finally {
      bbbBusyRef.current = false;
      setBbbLoading(false);
    }
  };

  useEffect(() => {
    setBalls([]);
    setBbbError("");
    setBbbUpdated("");

    if (!matchId) return;

    loadBallByBall();

    const timer = completed
      ? null
      : setInterval(() => {
          loadBallByBall();
        }, 20000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchId, completed]);

  const ballLabel = (ball) => {
    const penalty = String(
      ball?.penalty ||
      ball?.extraType ||
      ""
    ).toLowerCase();

    if (
      ball?.wicket ||
      ball?.isWicket ||
      ball?.dismissal
    ) {
      return "W";
    }

    if (penalty.includes("wide")) {
      return "WD";
    }

    if (
      penalty.includes("no ball") ||
      penalty.includes("noball") ||
      penalty.includes("no-ball")
    ) {
      return "NB";
    }

    if (penalty.includes("leg bye")) {
      return "LB";
    }

    if (penalty.includes("bye")) {
      return "B";
    }

    const runs = Number(ball?.runs ?? 0);

    if (runs === 0) return "DOT";

    return String(runs);
  };

  const latest =
    balls.length > 0
      ? balls[balls.length - 1]
      : null;

  return (
    <section className="batzo-bbb-panel">
      <div className="batzo-bbb-head">
        <div>
          <span className="batzo-bbb-kicker">
            {completed ? "● MATCH COMMENTARY" : "● LIVE COMMENTARY"}
          </span>
          <h3>Ball by Ball</h3>
        </div>

        <button
          type="button"
          className="batzo-bbb-refresh"
          onClick={loadBallByBall}
          disabled={bbbLoading || !matchId}
        >
          {bbbLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {bbbUpdated && (
        <small className="batzo-bbb-updated">
          Updated {bbbUpdated}
        </small>
      )}

      {latest && (
        <div className="batzo-bbb-latest">
          <div className="batzo-bbb-ballno">
            {latest?.over ?? "-"}.
            {latest?.ball ?? "-"}
          </div>

          <div className="batzo-bbb-latest-main">
            <strong>
              {ballLabel(latest)}
            </strong>

            <span>
              {latest?.batsman?.name ||
               "Batsman"}
              {" • "}
              {latest?.bowler?.name ||
               "Bowler"}
            </span>
          </div>
        </div>
      )}

      {balls.length > 0 ? (
        <>
          <div className="batzo-bbb-recent-title">
            RECENT BALLS
          </div>

          <div className="batzo-bbb-balls">
            {balls.slice(-18).map((ball, index) => {
              const label = ballLabel(ball);

              const special =
                label === "W"
                  ? " wicket"
                  : label === "4"
                    ? " four"
                    : label === "6"
                      ? " six"
                      : label === "WD" ||
                        label === "NB"
                        ? " extra"
                        : "";

              return (
                <div
                  key={`${ball?.inning ?? 0}-${ball?.over ?? 0}-${ball?.ball ?? 0}-${index}`}
                  className={`batzo-ball-chip${special}`}
                  title={`${ball?.over ?? "-"}.${ball?.ball ?? "-"}`}
                >
                  <small>
                    {ball?.over ?? "-"}.
                    {ball?.ball ?? "-"}
                  </small>
                  <strong>{label}</strong>
                </div>
              );
            })}
          </div>

          <div style={{
            display: "grid",
            gap: "8px",
            marginTop: "14px"
          }}>
            {balls.slice(-12).reverse().map((ball, index) => (
              <div
                key={`commentary-${ball?.inning ?? 0}-${ball?.over ?? 0}-${ball?.ball ?? 0}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "46px 1fr",
                  gap: "10px",
                  padding: "10px 0",
                  borderTop: "1px solid rgba(255,255,255,.08)"
                }}
              >
                <strong style={{ color: "#32f58a" }}>
                  {ball?.over ?? "-"}.{ball?.ball ?? "-"}
                </strong>
                <span style={{ color: "#d4ddd8", lineHeight: 1.45 }}>
                  {ball?.text ||
                    `${ball?.batsman?.name || "Batsman"} • ${ballLabel(ball)}`}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : !bbbLoading && !bbbError ? (
        <div className="batzo-bbb-empty">
          Ball-by-ball events will appear here
          when the provider has them.
        </div>
      ) : null}

      {bbbError && (
        <div className="batzo-bbb-error">
          {bbbError}
        </div>
      )}
    </section>
  );
}

function LiveScoreboard({ match, onBack }) {
  if (!match) return null;

  const completed =
    String(match?.status || "").toUpperCase() === "RESULT" ||
    !!match?.raw?.matchEnded;
  const inn = match.innings || {};
  const batsmen = match.batsmen || [];
  const bowlers = match.bowlers || [];
  const balls = match.recentBalls || [];

  return (
    <section className="matches-page" style={{ paddingBottom: "110px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: "16px",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid rgba(50,245,138,.35)",
          background: "rgba(16,25,22,.92)",
          color: "#32f58a",
          fontWeight: 900
        }}
      >
        ← BACK
      </button>

      <div className="page-heading">
        <span>{completed ? "✅ FINAL SCORECARD" : "🔴 LIVE SCOREBOARD"}</span>
        <h1>{match.ac} vs {match.bc}</h1>
        <p>{match.league}</p>
      </div>

      <div style={{
        padding: "20px",
        borderRadius: "20px",
        background: "linear-gradient(135deg,#10251a,#08130e)",
        border: "1px solid rgba(50,245,138,.28)",
        marginBottom: "16px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center"
        }}>
          <div>
            <div style={{ fontSize: "30px" }}>{match.af}</div>
            <strong>{match.ac}</strong>
          </div>

          <div>
            <div style={{
              fontSize: "30px",
              fontWeight: 900,
              color: "#32f58a"
            }}>
              {completed
                ? `${match.as || "-"} • ${match.bs || "-"}`
                : inn.score || match.as}
            </div>
            <small>
              {completed
                ? match.statusText || "Match completed"
                : `${inn.overs || match.over || "-"} overs`}
            </small>
          </div>

          <div>
            <div style={{ fontSize: "30px" }}>{match.bf}</div>
            <strong>{match.bc}</strong>
          </div>
        </div>

        <div style={{
          textAlign: "center",
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(255,255,255,.08)"
        }}>
          <strong>
            {completed
              ? match.statusText || "Match completed"
              : `🎯 Target: ${inn.target || "-"}`}
          </strong>
          <div style={{ marginTop: "6px", color: "#32f58a" }}>
            {completed
              ? "Final score"
              : inn.need || "Live score updating..."}
          </div>
          <small style={{ opacity: .65 }}>
            Run Rate: {inn.runRate || "-"} • 🔄 {match.lastUpdated || "Live"}
          </small>
        </div>
      </div>

      <div className="simple-page" style={{ padding: "16px", marginBottom: "14px" }}>
        <h2>🏏 Batting</h2>
        {batsmen.map((x, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "1fr 42px 42px 70px",
            gap: "6px",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,.08)"
          }}>
            <div>
              <strong>{x.name}</strong>
              <small style={{ display: "block", opacity: .65 }}>{x.status}</small>
            </div>
            <strong>{x.runs}</strong>
            <span>{x.balls}b</span>
            <span>{x.strikeRate} SR</span>
          </div>
        ))}
      </div>

      <div className="simple-page" style={{ padding: "16px", marginBottom: "14px" }}>
        <h2>🎯 Bowling</h2>
        {bowlers.map((x, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "1fr 55px 45px 45px",
            gap: "6px",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,.08)"
          }}>
            <strong>{x.name}</strong>
            <span>{x.overs} ov</span>
            <span>{x.runs} R</span>
            <strong style={{ color: "#32f58a" }}>{x.wickets} W</strong>
          </div>
        ))}
      </div>

      <div className="simple-page" style={{ padding: "16px" }}>
        <h2>🔴 Last 6 Balls</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {balls.map((ball, i) => (
            <span
              key={i}
              style={{
                width: "40px",
                height: "40px",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                fontWeight: 900,
                background:
                  ball === "W"
                    ? "#c33"
                    : ball === "6"
                    ? "#32f58a"
                    : "rgba(255,255,255,.12)",
                color: ball === "6" ? "#07130b" : "#fff"
              }}
            >
              {ball}
            </span>
          ))}
        </div>
      </div>
    
        <BallByBallPanel match={match} completed={completed} />
      </section>
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


function NoLiveMatches() {
  return (
    <div
      style={{
        padding: "24px 16px",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: "18px",
        background: "rgba(255,255,255,.03)",
        textAlign: "center",
        color: "#9ca3af",
        marginTop: "10px"
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏏</div>
      <strong
        style={{
          display: "block",
          color: "#ffffff",
          marginBottom: "6px"
        }}
      >
        No live matches right now
      </strong>
      <small>
        Real cricket matches will appear here automatically.
      </small>
    </div>
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

/* BATZO_MATCH_HUB_COMPONENT_V1_START */
function BatzoMatchSeriesGroup({
  title,
  matches,
  mode,
  onOpen
}) {
  return (
    <section className="bz-series-block">
      <div className="bz-series-head">
        <strong>{String(title || "CRICKET").toUpperCase()}</strong>
        <span>›</span>
      </div>

      {matches.map((match) => {
        const live = mode === "live";
        const upcoming = mode === "upcoming";
        const result = mode === "result";

        return (
          <button
            type="button"
            className="bz-score-list-row"
            key={match.id}
            onClick={() => onOpen(match)}
          >
            <div className="bz-match-meta">
              {live && (
                <span className="bz-live-label">
                  ● LIVE
                </span>
              )}

              <span>
                {match.matchLine || "Match"}
                {match.venue
                  ? ` • ${match.venue}`
                  : ""}
              </span>
            </div>

            <div className="bz-team-line">
              <div className="bz-team-identity">
                <span className="bz-team-logo">
                  {match.aImg ? (
                    <img
                      src={match.aImg}
                      alt=""
                    />
                  ) : (
                    match.af || "🏏"
                  )}
                </span>

                <strong>{match.ac}</strong>
                <small>{match.a}</small>
              </div>

              <div className="bz-team-value">
                {upcoming
                  ? match.time
                  : result
                    ? match.scoreA
                    : match.as}
              </div>
            </div>

            <div className="bz-team-line">
              <div className="bz-team-identity">
                <span className="bz-team-logo">
                  {match.bImg ? (
                    <img
                      src={match.bImg}
                      alt=""
                    />
                  ) : (
                    match.bf || "🏏"
                  )}
                </span>

                <strong>{match.bc}</strong>
                <small>{match.b}</small>
              </div>

              <div className="bz-team-value">
                {upcoming
                  ? match.clock
                  : result
                    ? match.scoreB
                    : match.bs}
              </div>
            </div>

            {live && (
              <div className="bz-match-status live">
                {match.statusText ||
                 match.raw?.status ||
                 "Live score updating…"}
              </div>
            )}

            {upcoming && (
              <div className="bz-match-status upcoming">
                VIEW CONTESTS →
              </div>
            )}

            {result && (
              <div className="bz-match-status result">
                {match.resultText ||
                 "Match completed"}
              </div>
            )}
          </button>
        );
      })}
    </section>
  );
}
/* BATZO_MATCH_HUB_COMPONENT_V1_END */

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


/* BATZO_HOME_FIRST_ACTION_GUARD */
function batzoRequireLogin(action) {
  const token =
    localStorage.getItem("batzo_token") ||
    localStorage.getItem("batzo_auth_token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  if (token) {
    if (typeof action === "function") action();
    return true;
  }

  if (typeof window.BATZO_REQUIRE_AUTH === "function") {
    window.BATZO_REQUIRE_AUTH(action);
    return false;
  }

  window.__BATZO_PENDING_ACTION__ =
    typeof action === "function" ? action : null;

  window.dispatchEvent(new Event("batzo-auth-required"));
  return false;
}




function BatzoAccountSettings({ onBack }) {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const accountRecaptchaRef = useRef(null);

  async function loadUser() {
    try {
      if (Capacitor.isNativePlatform()) {
        const r = await FirebaseAuthentication.getCurrentUser();
        const nextUser = r?.user || null;

        setUser(nextUser);

        // Native Android: synchronize the Firebase session
        // with the Batzo backend so Wallet receives a Batzo JWT.
        if (nextUser) {
          try {
            const tokenResult =
              await FirebaseAuthentication.getIdToken({
                forceRefresh: true
              });

            if (tokenResult?.token) {
              const sync = await firebaseAccountBackendSync(
                nextUser,
                tokenResult.token
              );

              if (sync?.token) {
                console.log(
                  "[BATZO] Native Firebase -> backend auth sync OK"
                );
              }
            }
          } catch (syncError) {
            console.warn(
              "[BATZO] Native Firebase -> backend auth sync failed:",
              syncError
            );
          }
        }
      } else {
        const nextUser = auth.currentUser || null;
        setUser(nextUser);

        if (nextUser) {
          try {
            await firebaseAccountBackendSync(nextUser);
            console.log(
              "[BATZO] Web Firebase -> backend auth sync OK"
            );
          } catch (syncError) {
            console.warn(
              "[BATZO] Web Firebase -> backend auth sync failed:",
              syncError
            );
          }
        }
      }
    } catch (e) {
      console.error("[BATZO] load account:", e);
    }
  }

  useEffect(() => {
    loadUser();

    if (!Capacitor.isNativePlatform()) {
      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser || null);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        accountRecaptchaRef.current?.clear();
      } catch (_) {}

      accountRecaptchaRef.current = null;

      const container =
        document.getElementById("batzo-account-recaptcha");

      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  function providers() {
    return Array.isArray(user?.providerData)
      ? user.providerData
      : [];
  }

  const googleProvider =
    providers().find(p => p?.providerId === "google.com");

  const phoneProvider =
    providers().find(p => p?.providerId === "phone");

  async function firebaseAccountBackendSync(user, nativeIdToken = null) {
    const idToken =
      nativeIdToken ||
      (user && typeof user.getIdToken === "function"
        ? await user.getIdToken(true)
        : null);

    if (!idToken) return null;

    const response = await fetch(
      batzoApiBase() + "/api/auth/firebase",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Firebase account sync failed."
      );
    }

    if (data.token) {
      localStorage.setItem("batzo_token", data.token);
    }

    if (data.user) {
      try {
        localStorage.setItem(
          "batzo_firebase_user",
          JSON.stringify(data.user)
        );
      } catch (_) {}
    }

    return data;
  }

  async function addGoogle() {
    setLoading(true);
    setNotice("");

    try {
      let current = null;

      if (Capacitor.isNativePlatform()) {
        try {
          const existing = await FirebaseAuthentication.getCurrentUser();
          current = existing?.user || null;
        } catch (_) {
          current = null;
        }

        let r;

        if (current) {
          r = await FirebaseAuthentication.linkWithGoogle();
        } else {
          r = await FirebaseAuthentication.signInWithGoogle();
        }

        if (!r?.user) {
          throw new Error("Google authentication did not return a user.");
        }

        setUser(r.user);

        try {
          const tokenResult =
            await FirebaseAuthentication.getIdToken({
              forceRefresh: true
            });

          if (tokenResult?.token) {
            await firebaseAccountBackendSync(r.user, tokenResult.token);
          }
        } catch (syncError) {
          console.warn("[BATZO] Google backend sync:", syncError);
        }

        setNotice(
          current
            ? "Google account connected: " + (r.user.email || "Google account")
            : "Google login successful: " + (r.user.email || "Google account")
        );
      } else {
        current = auth.currentUser;

        const provider = new GoogleAuthProvider();
        let r;

        if (current) {
          r = await linkWithPopup(current, provider);
        } else {
          r = await signInWithPopup(auth, provider);
        }

        if (!r?.user) {
          throw new Error("Google authentication did not return a user.");
        }

        setUser(r.user);

        try {
          await firebaseAccountBackendSync(r.user);
        } catch (syncError) {
          console.warn("[BATZO] Google backend sync:", syncError);
        }

        setNotice(
          current
            ? "Google account connected: " + (r.user.email || "Google account")
            : "Google login successful: " + (r.user.email || "Google account")
        );
      }
    } catch (e) {
      console.error("[BATZO] GOOGLE ACCOUNT:", e);

      if (e?.code === "auth/provider-already-linked") {
        setNotice("Google account is already connected.");
      } else if (e?.code === "auth/credential-already-in-use") {
        setNotice(
          "This Google account belongs to another Firebase account."
        );
      } else if (e?.code === "auth/popup-closed-by-user") {
        setNotice("Google login was cancelled.");
      } else {
        setNotice(e?.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    setLoading(true);
    setNotice("");

    try {
      const normalized =
        phone.startsWith("+")
          ? phone
          : "+91" + phone.replace(/\D/g, "");

      if (!/^\+91\d{10}$/.test(normalized)) {
        throw new Error(
          "Enter a valid 10-digit Indian mobile number."
        );
      }

      /*
       * ACCOUNT SETTINGS = LINK PHONE TO EXISTING ACCOUNT.
       * We must NOT sign in as a new Firebase user here.
       */
      if (Capacitor.isNativePlatform()) {
        const current =
          await FirebaseAuthentication.getCurrentUser();

        if (!current?.user) {
          throw new Error(
            "Please login first, then connect your mobile number."
          );
        }

        const r =
          await FirebaseAuthentication.linkWithPhoneNumber({
            phoneNumber: normalized
          });

        if (!r?.verificationId) {
          throw new Error(
            "Firebase did not return an OTP verification ID."
          );
        }

        setVerificationId(r.verificationId);

        setNotice(
          "OTP sent. Enter the OTP below to connect this number."
        );

        return;
      }

      const current = auth.currentUser;

      if (!current) {
        throw new Error(
          "Please login first, then connect your mobile number."
        );
      }

      const container =
        document.getElementById("batzo-account-recaptcha");

      if (!container) {
        throw new Error(
          "reCAPTCHA container not found."
        );
      }

      /*
       * Completely remove any previous verifier/widget.
       */
      try {
        accountRecaptchaRef.current?.clear();
      } catch (_) {}

      accountRecaptchaRef.current = null;
      container.innerHTML = "";

      /*
       * Create exactly ONE verifier for this Account Settings
       * component instance.
       */
      accountRecaptchaRef.current =
        new RecaptchaVerifier(
          auth,
          container,
          {
            size: "invisible"
          }
        );

      await accountRecaptchaRef.current.render();

      const confirmation =
        await webLinkWithPhoneNumber(
          current,
          normalized,
          accountRecaptchaRef.current
        );

      setConfirmation(confirmation);

      setNotice(
        "OTP sent. Enter the OTP below to connect this number."
      );

    } catch (e) {
      console.error(
        "[BATZO] ACCOUNT SETTINGS PHONE LINK:",
        e
      );

      setNotice(
        e?.message ||
        "OTP could not be sent."
      );

      try {
        accountRecaptchaRef.current?.clear();
      } catch (_) {}

      accountRecaptchaRef.current = null;

      const container =
        document.getElementById("batzo-account-recaptcha");

      if (container) {
        container.innerHTML = "";
      }

    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) {
      setNotice("Enter the OTP.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      let nextUser = null;

      if (Capacitor.isNativePlatform()) {
        if (!verificationId) {
          throw new Error(
            "Verification ID missing. Please send OTP again."
          );
        }

        const r =
          await FirebaseAuthentication.confirmVerificationCode({
            verificationId,
            verificationCode: otp.trim()
          });

        nextUser = r?.user || null;
      } else {
        if (!confirmation) {
          throw new Error("OTP session expired. Send OTP again.");
        }

        const r = await confirmation.confirm(otp.trim());
        nextUser = r?.user || null;
      }

      if (!nextUser) {
        await loadUser();

        if (Capacitor.isNativePlatform()) {
          const r =
            await FirebaseAuthentication.getCurrentUser();
          nextUser = r?.user || null;
        } else {
          nextUser = auth.currentUser;
        }
      }

      if (!nextUser) {
        throw new Error(
          "Firebase verified the OTP but current user was not returned."
        );
      }

      setUser(nextUser);
      setOtp("");
      setVerificationId("");
      setConfirmation(null);

      setNotice(
        "Mobile OTP verified successfully: " +
        (nextUser.phoneNumber || phone)
      );
    } catch (e) {
      console.error("[BATZO] OTP VERIFY:", e);
      setNotice(e?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px",
          background: "#111",
          color: "#fff"
        }}
      >
        <button data-batzo-account-back="1"
          type="button"
          onClick={onBack}
          data-batzo-account-header-back="true"
          style={{
            border: 0,
            background: "transparent",
            color: "#fff",
            fontSize: 28,
            fontWeight: 900
          }}
        >
          ←
        </button>

        <strong style={{ fontSize: 20 }}>
          ACCOUNT SETTINGS
        </strong>
      </header>

      <main style={{ padding: 18 }}>
        <section
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 20,
            marginBottom: 14
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#777"
            }}
          >
            BATZO ACCOUNT
          </div>

          <h2 style={{ margin: "8px 0" }}>
            {user?.displayName || "Batzo User"}
          </h2>

          <div
            style={{
              fontSize: 13,
              color: "#666",
              wordBreak: "break-word"
            }}
          >
            {user?.email ||
             user?.phoneNumber ||
             "Firebase account connected"}
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: 20
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            CONNECTED ACCOUNTS
          </h3>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 16,
              marginBottom: 14
            }}
          >
            <strong>🔵 GOOGLE ACCOUNT</strong>

            <div
              style={{
                marginTop: 8,
                color: "#555",
                wordBreak: "break-word"
              }}
            >
              {googleProvider?.email ||
               (user?.email && !phoneProvider
                 ? user.email
                 : "No Google account connected")}
            </div>

            <div
              style={{
                marginTop: 8,
                fontWeight: 900,
                color: googleProvider
                  ? "#188038"
                  : "#777"
              }}
            >
              {googleProvider
                ? "✓ GOOGLE CONNECTED"
                : "GOOGLE NOT CONNECTED"}
            </div>

            {!googleProvider && (
              <button
                type="button"
                disabled={loading}
                onClick={addGoogle}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: 14,
                  border: 0,
                  borderRadius: 12,
                  background: "#111",
                  color: "#fff",
                  fontWeight: 900
                }}
              >
                {loading
                  ? "CONNECTING..."
                  : "ADD GOOGLE ACCOUNT"}
              </button>
            )}
          </div>

          <div data-batzo="BATZO_LOGOUT_BUTTON" style={{marginBottom:14}}>
<button type="button" onClick={async () => {
  try {
    await FirebaseAuthentication.signOut();
  } catch (e) {
    console.error("[BATZO] Logout error:", e);
  }
  window.location.reload();
}} style={{
  width:"100%",
  padding:14,
  border:0,
  borderRadius:12,
  background:"#d32f2f",
  color:"#fff",
  fontWeight:900,
  fontSize:16
}}>
🚪 LOGOUT
</button>
</div>
<div
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 16
            }}
          >
            <strong>📱 MOBILE OTP</strong>

            <div
              style={{
                marginTop: 8,
                color: "#555"
              }}
            >
              {phoneProvider?.phoneNumber ||
               user?.phoneNumber ||
               "Mobile number not verified"}
            </div>

            <div
              style={{
                marginTop: 8,
                fontWeight: 900,
                color: phoneProvider
                  ? "#188038"
                  : "#777"
              }}
            >
              {phoneProvider
                ? "✓ MOBILE OTP VERIFIED"
                : "MOBILE NOT VERIFIED"}
            </div>

            {!phoneProvider && (
              <>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10 digit mobile number"
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: 12,
                    padding: 14,
                    border: "1px solid #ddd",
                    borderRadius: 12
                  }}
                />

                {!verificationId && !confirmation ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={sendOtp}
                  >
                    {loading
                      ? "SENDING OTP..."
                      : "SEND OTP"}
                  </button>
                ) : (
                  <>
                    <input
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="ENTER OTP"
                      inputMode="numeric"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: 10,
                        padding: 14,
                        border: "1px solid #ddd",
                        borderRadius: 12
                      }}
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={verifyOtp}
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: 14,
                        border: 0,
                        borderRadius: 12,
                        background: "#111",
                        color: "#fff",
                        fontWeight: 900
                      }}
                    >
                      {loading
                        ? "VERIFYING..."
                        : "VERIFY OTP"}
                    </button>
                  </>
                )}
              </>
            )}

            <div id="batzo-account-recaptcha" />
          </div>

          {notice && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: "#fff3cd",
                color: "#664d03",
                fontWeight: 700,
                fontSize: 13,
                wordBreak: "break-word"
              }}
            >
              {notice}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}




const BATZO_MATCH_UI_CACHE_KEY = "batzo_match_ui_cache_v2";

function batzoReadMatchUiCache() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(BATZO_MATCH_UI_CACHE_KEY) || "null"
    );

    if (!parsed || typeof parsed !== "object") return null;

    const age = Date.now() - Number(parsed.savedAt || 0);
    if (!Number.isFinite(age) || age < 0 || age > 5 * 60 * 1000) {
      return null;
    }

    return {
      live: Array.isArray(parsed.live) ? parsed.live : [],
      upcoming: Array.isArray(parsed.upcoming) ? parsed.upcoming : [],
      result: Array.isArray(parsed.result) ? parsed.result : []
    };
  } catch (_) {
    return null;
  }
}

function BatzoApp() {
  const [tab, setTab] = useState("home");
  /* BATZO FINAL ANDROID BACK FLOW */
  useEffect(() => {
    const handleBatzoBack = () => {
      setTab(prev => {
        if (
          typeof batzoTabHistory !== "undefined" &&
          batzoTabHistory.current &&
          batzoTabHistory.current.length > 0
        ) {
          const history = batzoTabHistory.current;
          let previous = history.pop();

          if (previous === prev && history.length > 0) {
            previous = history.pop();
          }

          if (previous && previous !== prev) {
            if (typeof batzoPreviousTab !== "undefined") {
              batzoPreviousTab.current = previous;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
            return previous;
          }
        }

        if (prev !== "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return "home";
        }

        /*
         * At Home there is no previous tab.
         * Tell native Android that the next back action may exit.
         */
        window.__BATZO_AT_HOME__ = true;
        return prev;
      });
    };

    window.__BATZO_AT_HOME__ = (tab === "home");
    window.addEventListener("batzo-native-back", handleBatzoBack);

    return () => {
      window.removeEventListener("batzo-native-back", handleBatzoBack);
    };
  }, []);

  useEffect(() => {
    window.__BATZO_AT_HOME__ = (tab === "home");
  }, [tab]);
/* batzo-profile-click-fix */
  useEffect(() => {
    const onProfileClick = (e) => {
      const btn = e.target && e.target.closest
        ? e.target.closest('button[aria-label="Profile"]')
        : null;

      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      setTab(prev => {
        if (prev !== "profile") {
          if (typeof batzoTabHistory !== "undefined" && batzoTabHistory.current) {
            batzoTabHistory.current.push(prev);
          }
          if (typeof batzoPreviousTab !== "undefined") {
            batzoPreviousTab.current = prev;
          }
        }
        return "profile";
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("click", onProfileClick, true);

    return () => {
      document.removeEventListener("click", onProfileClick, true);
    };
  }, []);

  const [accountSettings, setAccountSettings] = useState(false);

  useEffect(() => {
    const openAccountSettings = () => {
      setAccountSettings(true);
    };

    window.addEventListener(
      "batzo-account-settings",
      openAccountSettings
    );

    return () => {
      window.removeEventListener(
        "batzo-account-settings",
        openAccountSettings
      );
    };
  }, []);

  /*
   * BATZO CLEAN TAB + ANDROID BACK NAVIGATION
   * IMPORTANT: this code is AFTER tab declaration.
   */
  const batzoTabHistory = useRef([]);
  const batzoPreviousTab = useRef(tab);

  /*
   * BATZO FINAL TAB NAVIGATION
   * Keep a real React tab history so Android hardware
   * Back can return to the previous Batzo screen.
   */
    const navigateTab = (nextTab) => {
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
  };



  const [initialMatchCache] = useState(() => batzoReadMatchUiCache());
  const [notice, setNotice] = useState("");
  const [selectedLiveMatch, setSelectedLiveMatch] = useState(null);
  const [realLiveMatches, setRealLiveMatches] = useState(
    () => initialMatchCache?.live || []
  );
  const [realUpcomingMatches, setRealUpcomingMatches] = useState(
    () => initialMatchCache?.upcoming || []
  );
  const [realResultMatches, setRealResultMatches] = useState(
    () => initialMatchCache?.result || []
  );
  const [matchesLoading, setMatchesLoading] = useState(
    () => !initialMatchCache
  );

  const [matchesTopTab, setMatchesTopTab] = useState("live");
  const [matchesFilter, setMatchesFilter] = useState("all");
  const [search, setSearch] = useState("");


  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const apiBase =
      (import.meta.env.VITE_API_BASE_URL ||
        "https://batzo.onrender.com"
      ).replace(/\/+$/, "");

    const json = async (path) => {
      const response = await fetch(
        `${apiBase}${path}`,
        {
          headers: {
            Accept: "application/json"
          },
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `${path} HTTP ${response.status}`
        );
      }

      return response.json();
    };

    /* BATZO_MATCH_SCOPE_V3_START
       FINAL MATCH SCOPE:

       KEEP:
       1. INTERNATIONAL MEN - country vs country
       2. INDIA DOMESTIC MEN - Indian state/association vs Indian state/association
       3. INDIA DOMESTIC WOMEN - Indian state/association women

       REMOVE:
       - International Women
       - Foreign domestic/state cricket
       - CPL / BBL / county / foreign franchise cricket
       - A teams / U19 / academy / XI / development teams
    */

    const batzoNormalizeSide = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[’']/g, "")
        .replace(
          /\b(womens|women|woman|ladies|mens|men)\b/g,
          " "
        )
        .replace(/\bcricket team\b/g, " ")
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const batzoRawTeams = (m) => {
      if (
        Array.isArray(m?.teams) &&
        m.teams.filter(Boolean).length >= 2
      ) {
        return m.teams.filter(Boolean).slice(0, 2);
      }

      if (Array.isArray(m?.teamInfo)) {
        return m.teamInfo
          .map((x) => x?.name)
          .filter(Boolean)
          .slice(0, 2);
      }

      return [];
    };

    const batzoIsWomenMatch = (m) => {
      const text = [
        m?.name,
        m?.status,
        ...(Array.isArray(m?.teams) ? m.teams : []),
        ...(Array.isArray(m?.teamInfo)
          ? m.teamInfo.map((x) => x?.name)
          : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return /\b(women|womens|woman|ladies)\b/.test(
        text.replace(/[’']/g, "")
      );
    };

    /*
     * Senior international country names.
     * Exact-name matching prevents franchise/state teams
     * from being mistaken for internationals.
     */
    const BATZO_COUNTRIES = new Set([
      "afghanistan",
      "argentina",
      "australia",
      "austria",
      "bahamas",
      "bahrain",
      "bangladesh",
      "belgium",
      "belize",
      "bermuda",
      "bhutan",
      "botswana",
      "brazil",
      "bulgaria",
      "canada",
      "cayman islands",
      "chile",
      "china",
      "cook islands",
      "croatia",
      "cyprus",
      "czech republic",
      "czechia",
      "denmark",
      "england",
      "estonia",
      "fiji",
      "finland",
      "france",
      "gambia",
      "germany",
      "ghana",
      "gibraltar",
      "greece",
      "guernsey",
      "hong kong",
      "hong kong china",
      "hungary",
      "india",
      "indonesia",
      "iran",
      "ireland",
      "isle of man",
      "israel",
      "italy",
      "jamaica",
      "japan",
      "jersey",
      "kenya",
      "kuwait",
      "lesotho",
      "luxembourg",
      "malawi",
      "malaysia",
      "maldives",
      "mali",
      "malta",
      "mexico",
      "mongolia",
      "mozambique",
      "myanmar",
      "namibia",
      "nepal",
      "netherlands",
      "new zealand",
      "nigeria",
      "norway",
      "oman",
      "pakistan",
      "panama",
      "papua new guinea",
      "peru",
      "philippines",
      "portugal",
      "qatar",
      "romania",
      "rwanda",
      "saudi arabia",
      "scotland",
      "serbia",
      "seychelles",
      "sierra leone",
      "singapore",
      "slovenia",
      "south africa",
      "south korea",
      "spain",
      "sri lanka",
      "eswatini",
      "sweden",
      "switzerland",
      "tanzania",
      "thailand",
      "turkey",
      "turkiye",
      "uganda",
      "united arab emirates",
      "uae",
      "united states",
      "united states of america",
      "usa",
      "vanuatu",
      "west indies",
      "zambia",
      "zimbabwe"
    ]);

    /*
     * Indian senior domestic state/association teams.
     * Women suffix is removed before matching, so both
     * men's and women's domestic teams are supported.
     */
    const BATZO_INDIA_DOMESTIC = new Set([
      "andhra",
      "andhra pradesh",
      "arunachal pradesh",
      "assam",
      "baroda",
      "bengal",
      "bihar",
      "chandigarh",
      "chhattisgarh",
      "delhi",
      "goa",
      "gujarat",
      "haryana",
      "himachal pradesh",
      "hyderabad",
      "jammu and kashmir",
      "jharkhand",
      "karnataka",
      "kerala",
      "madhya pradesh",
      "maharashtra",
      "manipur",
      "meghalaya",
      "mizoram",
      "mumbai",
      "nagaland",
      "odisha",
      "orissa",
      "puducherry",
      "pondicherry",
      "punjab",
      "railways",
      "rajasthan",
      "saurashtra",
      "services",
      "sikkim",
      "tamil nadu",
      "tripura",
      "uttar pradesh",
      "uttarakhand",
      "vidarbha",
      "east zone",
      "south zone",
      "north zone",
      "west zone",
      "central zone",
      "north east zone"
    ]);

    const batzoMatchCategory = (m) => {
      /* BATZO_INDIA_LEAGUE_CLASSIFIER_V1 */
      const seriesScopeText = [
        m?.name,
        m?.series,
        m?.seriesName,
        m?.raw?.seriesName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const isIndiaWomenLeague =
        /\b(women'?s premier league|womens premier league|\bwpl\b)\b/.test(
          seriesScopeText
        );

      const isIndiaMenLeague =
        /\b(indian premier league|\bipl\b|tamil nadu premier league|\btnpl\b|maharaja trophy|sher-e-punjab t20 league|uttar pradesh t20|up t20 league|delhi premier league|bengal pro t20|kerala cricket league)\b/.test(
          seriesScopeText
        );

      if (isIndiaWomenLeague) {
        return "INDIA LEAGUE WOMEN";
      }

      if (isIndiaMenLeague) {
        return "INDIA LEAGUE MEN";
      }


      const teams = batzoRawTeams(m);

      if (teams.length < 2) {
        return null;
      }

      const teamA = batzoNormalizeSide(teams[0]);
      const teamB = batzoNormalizeSide(teams[1]);

      const fullText = [
        m?.name,
        teams[0],
        teams[1]
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      /*
       * No junior/A/development matches.
       */
      if (
        /\b(u19|u-19|under 19|under-19|u23|u-23|under 23|under-23|academy|development|emerging|presidents xi|president xi|board xi|a team)\b/.test(
          fullText
        ) ||
        /\b(india a|england lions|south africa a|australia a|pakistan a|new zealand a|sri lanka a|bangladesh a)\b/.test(
          fullText
        )
      ) {
        return null;
      }

      const international =
        BATZO_COUNTRIES.has(teamA) &&
        BATZO_COUNTRIES.has(teamB);

      /*
       * INTERNATIONAL WOMEN explicitly removed.
       */
      if (international) {
        return batzoIsWomenMatch(m)
          ? "INTERNATIONAL WOMEN"
          : "INTERNATIONAL MEN";
      }

      const indiaDomestic =
        BATZO_INDIA_DOMESTIC.has(teamA) &&
        BATZO_INDIA_DOMESTIC.has(teamB);

      if (indiaDomestic) {
        return batzoIsWomenMatch(m)
          ? "INDIA DOMESTIC WOMEN"
          : "INDIA DOMESTIC MEN";
      }

      /*
       * Foreign domestic, franchise, county,
       * CPL, BBL and other series.
       */
      return batzoIsWomenMatch(m)
        ? "LEAGUE WOMEN"
        : "LEAGUE";
    };

    const batzoWantedMatch = (m) =>
      Boolean(m);

    /* BATZO_MATCH_SCOPE_V3_END */

    const upcomingAdapter = (m, index) => {
      const teams =
        Array.isArray(m?.teams)
          ? m.teams
          : [];

      const a = teams[0] || "Team 1";
      const b = teams[1] || "Team 2";

      const info =
        Array.isArray(m?.teamInfo)
          ? m.teamInfo
          : [];

      const metaA =
        info.find((t) => t?.name === a) || {};

      const metaB =
        info.find((t) => t?.name === b) || {};

      const short = (name, meta) => {
        if (meta?.shortname) {
          return meta.shortname;
        }

        return String(name || "")
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .join("")
          .slice(0, 4)
          .toUpperCase() || "TEAM";
      };

      let dt = null;

      try {
        const raw =
          m?.dateTimeGMT ||
          m?.date ||
          "";

        if (raw) {
          const normalized =
            /Z$|[+-]\d\d:\d\d$/.test(raw)
              ? raw
              : `${raw}Z`;

          const parsed =
            new Date(normalized);

          if (!Number.isNaN(parsed.getTime())) {
            dt = parsed;
          }
        }
      } catch (_) {}

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

      return {
        id:
          m?.id ||
          `real-upcoming-${index}`,

        league:
          m?.name ||
          String(
            m?.matchType || "CRICKET"
          ).toUpperCase(),

        a,
        ac: short(a, metaA),
        af: batzoTeamFlag(a),
        aImg: metaA?.img || "",

        b,
        bc: short(b, metaB),
        bf: batzoTeamFlag(b),
        bImg: metaB?.img || "",

        time: dt
          ? dt.toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short"
              }
            )
          : "Upcoming",

        clock: dt
          ? dt.toLocaleTimeString(
              "en-IN",
              {
                hour: "numeric",
                minute: "2-digit"
              }
            )
          : "TBA",

        series: seriesName,
        matchLine,
        venue: m?.venue || "",
        status: "UPCOMING",
        category:
          batzoMatchCategory(m) ||
          (
            batzoIsWomenMatch(m)
              ? "LEAGUE WOMEN"
              : "LEAGUE"
          ),
        raw: m
      };
    };


    const resultAdapter = (m, index) => {
      const base = upcomingAdapter(m, index);

      const scores =
        Array.isArray(m?.score)
          ? m.score
          : [];

      const formatScore = (x) => {
        if (!x || x?.r == null) return "-";

        if (x?.display) {
          return String(x.display);
        }

        const main =
          `${x.r}/${x.w ?? 0}`;

        return x?.o != null
          ? `${main} (${x.o})`
          : main;
      };

      return {
        ...base,
        status: "RESULT",
        resultText:
          m?.status ||
          "Match completed",
        scoreA: formatScore(scores[0]),
        scoreB: formatScore(scores[1]),
        raw: m
      };
    };

    const loadRealMatches = async () => {
      const trueValue = (value) =>
        value === true ||
        value === 1 ||
        String(value || "").toLowerCase() === "true";

      const statusOf = (m) =>
        String(m?.status || "").trim().toLowerCase();

      const timeOf = (m) => {
        const raw = m?.dateTimeGMT || m?.date || "";
        if (!raw) return NaN;

        const normalized =
          /Z$|[+-]\d\d:\d\d$/.test(raw)
            ? raw
            : `${raw}Z`;

        return Date.parse(normalized);
      };

      const ended = (m) => {
        const status = statusOf(m);

        return trueValue(m?.matchEnded) ||
          /\b(won|completed|complete|finished|drawn|abandoned|cancelled|canceled|no result)\b/.test(status);
      };

      const live = (m) => {
        if (!m || ended(m)) return false;

        const status = statusOf(m);
        const time = timeOf(m);

        if (
          Number.isFinite(time) &&
          time > Date.now() + 30 * 60 * 1000
        ) {
          return false;
        }

        return trueValue(m?.matchStarted) ||
          /\b(live|in progress|innings break|lunch|tea break)\b/.test(status);
      };

      const upcoming = (m) => {
        if (!m || ended(m) || live(m)) return false;

        const time = timeOf(m);
        const status = statusOf(m);

        if (
          Number.isFinite(time) &&
          time > Date.now() + 5 * 60 * 1000
        ) {
          return true;
        }

        if (!trueValue(m?.matchStarted)) {
          return true;
        }

        return /\b(upcoming|scheduled|not started|starts at|match starts)\b/.test(status);
      };

      const payloadRows = (payload) => {
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
      };

      const unique = (list) => {
        const seen = new Set();

        return list.filter((m, index) => {
          const id =
            m?.id ||
            `${m?.name || "match"}-${m?.dateTimeGMT || m?.date || index}`;

          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      };

      try {
        // One board request is enough for all three tabs.
        const matchesPayload = await json("/api/cricket/matches");
        const matchRows = payloadRows(matchesPayload);
        const liveSource = matchRows.filter(live);

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
                  )
              })
            );

        const upcomingSource = matchRows.filter(upcoming);

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

        const genuineResults =
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

        const anySuccess = Array.isArray(matchRows);

        if (!cancelled && anySuccess) {
          setRealLiveMatches(genuineLive);
          setRealUpcomingMatches(genuineUpcoming);
          setRealResultMatches(genuineResults);
          setMatchesLoading(false);

          if (
            genuineLive.length +
              genuineUpcoming.length +
              genuineResults.length >
            0
          ) {
            try {
              localStorage.setItem(
                BATZO_MATCH_UI_CACHE_KEY,
                JSON.stringify({
                  live: genuineLive,
                  upcoming: genuineUpcoming,
                  result: genuineResults,
                  savedAt: Date.now()
                })
              );
            } catch (_) {}
          }
        }

        if (!anySuccess && !cancelled) {
          setMatchesLoading(false);
          clearTimeout(retryTimer);

          retryTimer = setTimeout(
            loadRealMatches,
            15000
          );
        }
      } catch (error) {
        console.warn(
          "BATZO real cricket refresh:",
          error
        );

        if (!cancelled) {
          setMatchesLoading(false);
          clearTimeout(retryTimer);

          retryTimer = setTimeout(
            loadRealMatches,
            15000
          );
        }
      }
    };

    loadRealMatches();

    /*
     * Refresh from Batzo backend occasionally.
     * Backend caching protects CricketData quota.
     */
    const interval = setInterval(
      loadRealMatches,
      60 * 1000
    );

    const onFocus = () => {
      loadRealMatches();
    };

    const onVisible = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadRealMatches();
      }
    };

    window.addEventListener(
      "focus",
      onFocus
    );

    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    return () => {
      cancelled = true;

      clearTimeout(retryTimer);
      clearInterval(interval);

      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onVisible
      );
    };
  }, []);

  const displayLiveMatches =
    realLiveMatches;

  const displayUpcomingMatches = realUpcomingMatches;

  const openMatch = (match) => {
    try {
      const mode = String(match?.status || "").toUpperCase();
      const isScoreMatch =
        mode === "LIVE" ||
        mode === "RESULT" ||
        match?.innings ||
        match?.raw?.matchEnded;

      // Live and completed matches open the real scorecard.
      if (isScoreMatch) {
        batzoTabHistory.current.push(tab);
        batzoPreviousTab.current = tab;
        setSelectedLiveMatch(match);
        setTab("live-scoreboard");
        window.scrollTo({ top: 0, behavior: "smooth" });

        const apiBase =
          (import.meta.env.VITE_API_BASE_URL ||
            "https://batzo.onrender.com"
          ).replace(/\/+$/, "");

        fetch(
          `${apiBase}/api/cricket/scorecard/${encodeURIComponent(
            match?.id || match?.raw?.id || ""
          )}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store"
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then((payload) => {
            const detail = payload?.data || payload?.match || payload;
            if (!detail || typeof detail !== "object") return;

            const adapted = batzoLiveAdapter(detail);

            setSelectedLiveMatch((current) => {
              if (!current || String(current.id) !== String(match.id)) {
                return current;
              }

              return {
                ...current,
                ...adapted,
                status: match.status,
                statusText: detail.status || current.statusText,
                raw: detail,
                innings: detail.innings || current.innings,
                batsmen: detail.batsmen || [],
                bowlers: detail.bowlers || [],
                recentBalls: detail.recentBalls || [],
                lastUpdated: detail.lastUpdated || current.lastUpdated
              };
            });
          })
          .catch((error) => {
            console.warn("BATZO scorecard detail:", error);
          });

        return;
      }

      // Existing upcoming match -> contest flow remains unchanged.
      window.BATZO_ACTIVE_MATCH = match;

      try {
        localStorage.setItem(
          "batzo_selected_match",
          JSON.stringify(match)
        );
      } catch (e) {
        console.warn("BATZO selected match storage:", e);
      }

      setTab("contests");
    } catch (e) {
      console.warn("BATZO match flow:", e);
      setTab("contests");
    }
  };

  const displayResultMatches = realResultMatches;

  const activeMatchList =
    matchesTopTab === "live"
      ? displayLiveMatches
      : matchesTopTab === "upcoming"
        ? displayUpcomingMatches
        : displayResultMatches;

  const matchesVisible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return activeMatchList.filter((m) => {
      const category =
        String(
          m?.category ||
          m?.raw?.batzoCategory ||
          ""
        ).toUpperCase();

      if (
        matchesFilter === "international" &&
        !category.startsWith("INTERNATIONAL")
      ) {
        return false;
      }

      if (
        matchesFilter === "domestic" &&
        !category.startsWith("INDIA DOMESTIC")
      ) {
        return false;
      }

      if (
        matchesFilter === "league" &&
        !category.includes("LEAGUE")
      ) {
        return false;
      }

      if (
        matchesFilter === "women" &&
        !category.includes("WOMEN")
      ) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        m?.a,
        m?.b,
        m?.ac,
        m?.bc,
        m?.league,
        m?.series,
        m?.venue,
        m?.matchLine,
        m?.statusText,
        m?.resultText
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    activeMatchList,
    search,
    matchesFilter
  ]);

  const groupedMatches = useMemo(() => {
    const groups = new Map();

    for (const match of matchesVisible) {
      const title =
        String(
          match?.series ||
          match?.raw?.series ||
          match?.raw?.matchType ||
          "CRICKET"
        ).trim();

      const key = title || "CRICKET";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(match);
    }

    return Array.from(groups.entries());
  }, [matchesVisible]);

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
  };









  if (accountSettings) {
    return (
      <BatzoAccountSettings
        onBack={() => {
          batzoTabHistory.current = [];
          batzoPreviousTab.current = tab;
          setAccountSettings(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }






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
                  onClick={() => navigateTab("matches")}
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
                <button onClick={() => navigateTab("matches")}>View all →</button>
              </div>

              {displayLiveMatches.length > 0 ? (
                displayLiveMatches.map((m) => (
                  <LiveMatchCard
                    key={m.id}
                    match={m}
                    onOpen={openMatch}
                  />
                ))
              ) : (
                <NoLiveMatches />
              )}
            </section>

            <section className="section-block batzo-hidden-home-section">
              <div className="section-heading">
                <div>
                  <span>DON'T MISS OUT</span>
                  <h2>Upcoming Matches</h2>
                </div>
                <button onClick={() => navigateTab("matches")}>View all →</button>
              </div>

              <div className="upcoming-list">
                {displayUpcomingMatches.slice(0, 2).map((m) => (
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
          <section className="matches-page bz-match-hub">
            <div className="bz-match-title">
              <span>BATZO CRICKET</span>
              <h1>Matches</h1>
            </div>

            <div className="bz-main-match-tabs">
              <button
                type="button"
                className={
                  matchesTopTab === "live"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesTopTab("live")
                }
              >
                LIVE SCORE
              </button>

              <button
                type="button"
                className={
                  matchesTopTab === "upcoming"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesTopTab("upcoming")
                }
              >
                UPCOMING
              </button>

              <button
                type="button"
                className={
                  matchesTopTab === "result"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesTopTab("result")
                }
              >
                COMPLETE
              </button>
            </div>

            <div className="bz-match-filter-strip">
              <button
                type="button"
                className={
                  matchesFilter === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesFilter("all")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  matchesFilter === "international"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesFilter("international")
                }
              >
                International
              </button>

              <button
                type="button"
                className={
                  matchesFilter === "league"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesFilter("league")
                }
              >
                Series
              </button>

              <button
                type="button"
                className={
                  matchesFilter === "domestic"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesFilter("domestic")
                }
              >
                India Domestic
              </button>

              <button
                type="button"
                className={
                  matchesFilter === "women"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMatchesFilter("women")
                }
              >
                Women
              </button>
            </div>

            <div className="bz-match-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search teams, series or venue"
              />
            </div>

            <div className="bz-list-section-label">
              {matchesTopTab === "live"
                ? "LIVE MATCHES"
                : matchesTopTab === "upcoming"
                  ? "UPCOMING MATCHES"
                  : "COMPLETED MATCHES"}
            </div>

            {groupedMatches.length > 0 ? (
              groupedMatches.map(
                ([series, matches]) => (
                  <BatzoMatchSeriesGroup
                    key={series}
                    title={series}
                    matches={matches}
                    mode={matchesTopTab}
                    onOpen={openMatch}
                  />
                )
              )
            ) : matchesLoading ? (
              <div className="bz-no-match-data">
                <div>⏳</div>
                <strong>Loading real matches…</strong>
                <small>Live score is connecting.</small>
              </div>
            ) : (
              <div className="bz-no-match-data">
                <div>🏏</div>

                <strong>
                  {matchesTopTab === "live"
                    ? "No live matches right now"
                    : matchesTopTab === "upcoming"
                      ? "No upcoming matches available"
                      : "No completed matches available"}
                </strong>

                <small>
                  Real cricket data will appear here
                  automatically when available.
                </small>
              </div>
            )}
          </section>
        )}
        {tab === "live-scoreboard" && (
        <LiveScoreboard
          match={selectedLiveMatch}
          onBack={() => {
            const previous = batzoPreviousTab.current || "matches";
            setTab(previous);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
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
              onClick={() => {
                const openSettings = () => {
                  setAccountSettings(true);
                  setAccountData(() => {
                    try {
                      return JSON.parse(
                        localStorage.getItem("batzo_account_settings") ||
                        localStorage.getItem("batzo_firebase_user") ||
                        "{}"
                      );
                    } catch (_) {
                      return {};
                    }
                  });
                };

                openSettings();
              }}
            >
              ACCOUNT SETTINGS
            </button>
          </section>
        )}
      </main>

      
      {/* BATZO_WALLET_TAB_RENDER */}
      {/* END BATZO_WALLET_TAB_RENDER */}


      {/* BATZO_WALLET_TAB_RENDER_FINAL */}
      {tab === "wallet" && (
        <div
          id="batzo-wallet-final-anchor"
          style={{paddingBottom:"110px"}}
        >
          <BatzoWalletFinalPanel />
        </div>
      )}
      {/* END BATZO_WALLET_TAB_RENDER_FINAL */}

<nav className="bottom-navigation">
        <button
          className={tab === "home" ? "active" : ""}
          onClick={() => navigateTab("home")}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          className={tab === "matches" ? "active" : ""}
          onClick={() => navigateTab("matches")}
        >
          <span>🏏</span>
          <small>Matches</small>
        </button>

        <button
          className={tab === "contests" ? "active" : ""}
          onClick={() => navigateTab("contests")}
        >
          <span>🏆</span>
          <small>Contest</small>
        </button>

        <button
          className={tab === "teams" ? "active" : ""}
          onClick={() => navigateTab("teams")}
        >
          <span>👥</span>
          <small>My Team</small>
        </button>


        <button
          className={tab === "wallet" ? "active" : ""}
          onClick={() => {
            if (typeof batzoRequireLogin === "function") {
              navigateTab("wallet");
            } else {
              window.dispatchEvent(new Event("batzo-auth-required"));
            }
          }}
        >
          <span>◉</span>
          <small>Wallet</small>
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
  const SQUAD_KEY = "batzo_real_match_squads_v2";

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
    if (!match) return "no-match-selected";

    if (typeof match === "string") {
      return match.replace(/[^a-zA-Z0-9_-]/g, "-");
    }

    return String(
      match.id ||
      match.matchId ||
      match.key ||
      ((match.a || match.teamA || "team-a") + "-" +
       (match.b || match.teamB || "team-b"))
    ).replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function currentMatch() {
    const isOldDemo = function (match) {
      if (!match) return false;

      const raw = match?.raw || match;
      const id = match?.id || raw?.id || match?.matchId || raw?.matchId;
      const label = typeof match === "string"
        ? match
        : [
            match?.a,
            match?.b,
            raw?.name,
            raw?.matchName,
            raw?.title
          ].filter(Boolean).join(" ");

      const oldPair =
        /\b(?:ind|india)\b[\s\S]*\b(?:aus|australia)\b/i.test(label);
      const hasRealMarker = Boolean(
        raw?.provider ||
        raw?.providerMatchId ||
        raw?.dateTimeGMT ||
        raw?.venue ||
        String(id || "").includes(":")
      );

      return oldPair && !hasRealMarker;
    };

    if (window.BATZO_ACTIVE_MATCH && !isOldDemo(window.BATZO_ACTIVE_MATCH)) {
      return window.BATZO_ACTIVE_MATCH;
    }

    if (isOldDemo(window.BATZO_ACTIVE_MATCH)) {
      window.BATZO_ACTIVE_MATCH = null;
    }

    try {
      const stored = JSON.parse(
        localStorage.getItem("batzo_selected_match") || "null"
      );

      if (stored && typeof stored === "object" && !isOldDemo(stored)) {
        window.BATZO_ACTIVE_MATCH = stored;
        return stored;
      }

      if (isOldDemo(stored)) {
        localStorage.removeItem("batzo_selected_match");
      }
    } catch (_) {}

    return null;
  }

  function html(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[char];
      }
    );
  }

  function matchMeta(match) {
    const raw = match?.raw || match || {};
    const teams = Array.isArray(raw?.teams) ? raw.teams : [];
    const info = Array.isArray(raw?.teamInfo) ? raw.teamInfo : [];

    const nameA =
      match?.a || info[0]?.name || teams[0] || "Team A";
    const nameB =
      match?.b || info[1]?.name || teams[1] || "Team B";

    const code = function (value, fallback) {
      const direct = String(value || "").trim();
      if (direct) return direct.toUpperCase().slice(0, 7);

      return String(fallback || "TEAM")
        .split(/\s+/)
        .filter(Boolean)
        .map(function (part) { return part[0]; })
        .join("")
        .toUpperCase()
        .slice(0, 7) || "TEAM";
    };

    const aCode = code(match?.ac || info[0]?.shortname, nameA);
    const bCode = code(match?.bc || info[1]?.shortname, nameB);

    return {
      id: match?.id || raw?.id || match?.matchId || raw?.matchId || "",
      a: {
        name: String(nameA),
        code: aCode,
        flag: match?.af || batzoTeamFlag(nameA)
      },
      b: {
        name: String(nameB),
        code: bCode,
        flag: match?.bf || batzoTeamFlag(nameB)
      },
      label: aCode + " vs " + bCode
    };
  }

  function matchLabel(match) {
    return match ? matchMeta(match).label : "Select a match";
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
  /* BATZO_DEMO_CONTEST_FRONTEND_V1 */

  const contests = [
    {
      id: 1,
      name: "BATZO FREE DEMO CONTEST",
      title: "BATZO FREE DEMO CONTEST",
      match: currentMatch(),
      matchName: matchLabel(currentMatch()),
      matchId: matchMeta(currentMatch()).id || "selected-match",
      entryFee: 0,
      entry_fee: 0,
      entry: "₹0",
      prizePool: 0,
      prize_pool: 0,
      prize: "₹0",
      spots: 100,
      maxSpots: 100,
      max_spots: 100,
      joinedSpots: 0,
      status: "open",
      type: "practice",
      practice: true,
      isPractice: true,
      isDemo: true,
      description: "Free practice contest. No real money deducted."
    }
  ];

  try {
    const existing = (
      typeof window.BATZO_CONTESTS !== "undefined" &&
      Array.isArray(window.BATZO_CONTESTS)
    )
      ? window.BATZO_CONTESTS
      : [];

    for (const contest of existing) {
      if (
        !contests.some(
          item => String(item.name || item.title) ===
            String(contest.name || contest.title)
        )
      ) {
        contests.push(contest);
      }
    }
  } catch (_) {}

  return contests;
}


  async function players(match) {
    const sides = matchMeta(match);
    if (!sides.id) return [];

    const normalizeRole = function (value) {
      const role = String(value || "").trim().toUpperCase();
      if (role === "WK" || role.includes("WICKET") || role.includes("KEEPER")) return "WK";
      if (role === "AR" || role.includes("ALLROUND") || role.includes("ALL-ROUND")) return "AR";
      if (role === "BOWL" || role.includes("BOWL")) return "BOWL";
      return "BAT";
    };

    const normalizeTeam = function (value, index) {
      const team = String(value || "").trim().toUpperCase();
      const aCode = String(sides.a.code || "").toUpperCase();
      const bCode = String(sides.b.code || "").toUpperCase();
      const aName = String(sides.a.name || "").toUpperCase();
      const bName = String(sides.b.name || "").toUpperCase();

      if (team === aCode || team.includes(aName) || aName.includes(team)) return sides.a.code;
      if (team === bCode || team.includes(bName) || bName.includes(team)) return sides.b.code;
      return index % 2 === 0 ? sides.a.code : sides.b.code;
    };

    const cleanPlayers = function (list) {
      return list.map(function (player, index) {
        return Object.assign({}, player, {
          id: String(player.id || player.playerId || sides.id + "-player-" + index),
          name: String(player.name || player.playerName || "Player " + (index + 1)),
          role: normalizeRole(player.role || player.playingRole),
          team: normalizeTeam(player.team || player.teamName, index),
          credit: Number(player.credit ?? player.credits ?? 8.5)
        });
      });
    };

    try {
      const response = await fetch(
        "https://batzo.onrender.com/api/cricket/squad/" + encodeURIComponent(sides.id),
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      const data = await response.json();
      const realPlayers = Array.isArray(data?.players)
        ? data.players
        : Array.isArray(data?.data?.players)
          ? data.data.players
          : [];

      if (response.ok && realPlayers.length >= 11) {
        return cleanPlayers(realPlayers);
      }
    } catch (error) {
      console.warn("BATZO squad request failed:", error);
    }

    const fallback = [];
    const roles = [
      ["WK", 2],
      ["BAT", 4],
      ["AR", 2],
      ["BOWL", 4]
    ];

    [sides.a, sides.b].forEach(function (side) {
      roles.forEach(function (item) {
        for (let number = 1; number <= item[1]; number++) {
          fallback.push({
            id: String(sides.id) + "-" + side.code + "-" + item[0] + "-" + number,
            name: side.code + " " + item[0] + " Player " + number,
            role: item[0],
            team: side.code,
            credit: 8.5
          });
        }
      });
    });

    return fallback;
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

  function showSelectMatchFirst() {
    const r = shell(
      "Select a Match",
      "Choose a real upcoming match first",
      `
        <div style="
          padding:24px 16px;
          text-align:center;
          border-radius:16px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.10);
          color:#aeb8b2;
        ">
          Old IND vs AUS demo team has been removed.<br><br>
          Open Matches → Upcoming and select the match for which you want to create a team.
        </div>

        <button id="bzChooseRealMatch" type="button" style="
          width:100%;
          margin-top:12px;
          padding:14px;
          border:0;
          border-radius:12px;
          background:#24e778;
          color:#061008;
          font-weight:900;
        ">OPEN MATCHES</button>
      `
    );

    r.querySelector("#bzV11Back").onclick = goBack;
    r.querySelector("#bzChooseRealMatch").onclick = goBack;
  }

  function showContestTabs(selected) {
    if (!currentMatch()) {
      showSelectMatchFirst();
      return;
    }

    const list = getContests();
    const demoContest = {
      id: 1,
      matchId: matchMeta(currentMatch()).id || "selected-match",
      name: "BATZO FREE DEMO CONTEST",
      title: "BATZO FREE DEMO CONTEST",
      entry: "₹0",
      entryFee: 0,
      entry_fee: 0,
      prize: "₹0",
      prizePool: 0,
      spots: 100,
      maxSpots: 100,
      joinedSpots: 0,
      match: currentMatch(),
      type: "practice",
      practice: true,
      isPractice: true,
      isDemo: true,
      description: "Free BATZO demo contest. Entry is ₹0 and no wallet money is deducted."
    };

    if (!list.some(c => String(c.id) === String(demoContest.id))) {
      list.unshift(demoContest);
    }
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
      matchLabel(currentMatch()),
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

    if (!match) {
      showSelectMatchFirst();
      return;
    }

    const r = shell(
      contest.name || "Contest Details",
      matchLabel(match),
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
          
          <button
            id="bzContestLeaderboardButton"
            type="button"
            style="
              width:100%;
              margin-top:10px;
              padding:14px;
              border:0;
              border-radius:12px;
              background:#18231e;
              color:#24e778;
              font-weight:900;
            "
          >
            VIEW LEADERBOARD
          </button>

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

    
    const leaderboardButton =
      r.querySelector("#bzContestLeaderboardButton");

    if (leaderboardButton) {
      leaderboardButton.onclick = function () {
        openBatzoWinnerLeaderboard(contest);
      };
    }

r.querySelector("#bzV11Teams").onclick = function () {
      showMyTeams(match, contest);
    };

    r.querySelector("#bzV11Create").onclick = function () {
      showTeamBuilder(match, contest, null);
    };
  }

  function showMyTeams(match, contest) {
    if (!match) {
      showSelectMatchFirst();
      return;
    }

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
      matchLabel(match) + " • " + (contest.name || "Contest"),
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
      goBack();
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

  }

  async function showTeamBuilder(match, contest, editing) {
    if (!match) {
      showSelectMatchFirst();
      return;
    }

    const sides = matchMeta(match);

    const loadingRoot = shell(
      editing ? "Edit Team" : "Create Team",
      html(sides.label) + " • Select your Fantasy XI",
      `
        <div style="
          padding:32px 16px;
          text-align:center;
          color:#aeb8b2;
          border-radius:16px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.10);
        ">
          ⏳ Loading real ${html(sides.a.code)} and ${html(sides.b.code)} players…
        </div>
      `
    );

    loadingRoot.querySelector("#bzV11Back").onclick = function () {
      showMyTeams(match, contest);
    };

    const ps = await players(match);

    if (!Array.isArray(ps) || !ps.length) {
      const emptyRoot = shell(
        editing ? "Edit Team" : "Create Team",
        html(sides.label),
        `
          <div style="
            padding:28px 16px;
            text-align:center;
            color:#aeb8b2;
            border-radius:16px;
            background:#101a16;
            border:1px solid rgba(255,255,255,.10);
          ">
            The real squad has not been announced for this match yet.<br><br>
            No old IND vs AUS players will be shown.
          </div>
        `
      );

      emptyRoot.querySelector("#bzV11Back").onclick = function () {
        showMyTeams(match, contest);
      };
      return;
    }

    const existing = editing || {};
    const existingPlayers = Array.isArray(existing.players)
      ? existing.players
      : [];

    const selected = new Map();

    existingPlayers.forEach(function (p) {
      selected.set(String(p.id || p.name), p);
    });

    let filter = "WK";

    const r = shell(
      editing ? "Edit Team" : "Create Team",
      html(sides.label) + " • Select your Fantasy XI",
      `
        <div style="
          position:sticky;
          top:98px;
          z-index:20;
          padding:12px;
          border-radius:14px;
          background:#101a16;
          margin-bottom:10px;
          border:1px solid rgba(255,255,255,.10);
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          ">
            <strong id="bzPlayerCount">SELECTED: 0/11</strong>
            <strong id="bzTeamCount">${html(sides.a.code)} 0 • ${html(sides.b.code)} 0</strong>
          </div>

          <div id="bzRoleCount" style="
            margin-top:7px;
            font-size:12px;
            color:#aeb8b2;
          ">
            WK 0/1-4 • BAT 0/3-6 • AR 0/1-4 • BOWL 0/3-6
          </div>

          <div id="bzCreditCount" style="
            margin-top:5px;
            font-size:12px;
            color:#aeb8b2;
          ">
            Credits 0.0/100
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:6px;
          margin-bottom:10px;
        ">
          <button type="button" class="bzRoleFilter" data-role="WK"
            style="padding:11px 4px;border:0;border-radius:10px;
            background:#24e778;color:#061008;font-weight:900;">WK</button>

          <button type="button" class="bzRoleFilter" data-role="BAT"
            style="padding:11px 4px;border:0;border-radius:10px;
            background:#18231e;color:#fff;font-weight:900;">BAT</button>

          <button type="button" class="bzRoleFilter" data-role="AR"
            style="padding:11px 4px;border:0;border-radius:10px;
            background:#18231e;color:#fff;font-weight:900;">AR</button>

          <button type="button" class="bzRoleFilter" data-role="BOWL"
            style="padding:11px 4px;border:0;border-radius:10px;
            background:#18231e;color:#fff;font-weight:900;">BOWL</button>
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:6px;
          margin-bottom:10px;
        ">
          <div style="
            padding:9px;
            border-radius:10px;
            background:#16261e;
            text-align:center;
            font-weight:800;
          ">${html(sides.a.flag)} ${html(sides.a.name)}</div>

          <div style="
            padding:9px;
            border-radius:10px;
            background:#16261e;
            text-align:center;
            font-weight:800;
          ">${html(sides.b.flag)} ${html(sides.b.name)}</div>
        </div>

        <div id="bzPlayerList"></div>

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
          CONTINUE • 0/11
        </button>
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showMyTeams(match, contest);
    };

    function stats() {
      const arr = Array.from(selected.values());

      const count = function(role) {
        return arr.filter(function(p) {
          return String(p.role || "").toUpperCase() === role;
        }).length;
      };

      const wk = count("WK");
      const bat = count("BAT");
      const ar = count("AR");
      const bowl = count("BOWL");

      const sideA = arr.filter(function(p) {
        return String(p.team || "").toUpperCase() === sides.a.code;
      }).length;

      const sideB = arr.filter(function(p) {
        return String(p.team || "").toUpperCase() === sides.b.code;
      }).length;

      const credits = arr.reduce(function(total,p) {
        return total + Number(p.credit || 0);
      },0);

      return {wk,bat,ar,bowl,sideA,sideB,credits};
    }

    function updateHeader() {
      const x = stats();

      r.querySelector("#bzPlayerCount").textContent =
        "SELECTED: " + selected.size + "/11";

      r.querySelector("#bzTeamCount").textContent =
        sides.a.code + " " + x.sideA +
        " • " + sides.b.code + " " + x.sideB;

      r.querySelector("#bzRoleCount").textContent =
        "WK " + x.wk + "/1-4 • " +
        "BAT " + x.bat + "/3-6 • " +
        "AR " + x.ar + "/1-4 • " +
        "BOWL " + x.bowl + "/3-6";

      r.querySelector("#bzCreditCount").textContent =
        "Credits " + x.credits.toFixed(1) + "/100";

      r.querySelector("#bzTeamNext").textContent =
        "CONTINUE • " + selected.size + "/11";
    }

    function renderPlayers() {
      const list = r.querySelector("#bzPlayerList");

      const visible = ps.filter(function(p) {
        return String(p.role || "").toUpperCase() === filter;
      });

      list.innerHTML = "";

      if (!visible.length) {
        list.innerHTML = `
          <div style="
            padding:20px;
            text-align:center;
            color:#929aa7;
          ">
            No ${filter} players available.
          </div>
        `;
        return;
      }

      visible.forEach(function(p) {
        const id = String(p.id || p.name);
        const active = selected.has(id);

        const card = document.createElement("button");

        card.type = "button";
        card.className = "bz-player";

        card.style.cssText = `
          width:100%;
          text-align:left;
          padding:13px;
          margin:6px 0;
          border-radius:13px;
          border:1px solid ${active ? "#24e778" : "rgba(255,255,255,.10)"};
          background:${active ? "#14291d" : "#101a16"};
          color:#fff;
        `;

        card.innerHTML = `
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          ">
            <div>
              <strong>${p.name || "Player"}</strong>
              <div style="
                margin-top:4px;
                font-size:11px;
                color:#aeb8b2;
              ">
                ${p.team || ""} • ${p.role || ""}
              </div>
            </div>

            <div style="
              text-align:right;
              font-size:11px;
              color:#aeb8b2;
            ">
              <div>${Number(p.credit || 0).toFixed(1)} Cr</div>
              <div style="
                margin-top:5px;
                color:${active ? "#24e778" : "#8d9891"};
                font-weight:900;
              ">
                ${active ? "✓ SELECTED" : "SELECT"}
              </div>
            </div>
          </div>
        `;

        card.onclick = function() {
          if (selected.has(id)) {
            selected.delete(id);
            renderPlayers();
            updateHeader();
            return;
          }

          if (selected.size >= 11) {
            alert("Maximum 11 players allowed.");
            return;
          }

          const x = stats();

          const role = String(p.role || "").toUpperCase();

          if (role === "WK" && x.wk >= 4) {
            alert("Maximum 4 Wicket-Keepers allowed.");
            return;
          }

          if (role === "BAT" && x.bat >= 6) {
            alert("Maximum 6 Batsmen allowed.");
            return;
          }

          if (role === "AR" && x.ar >= 4) {
            alert("Maximum 4 All-Rounders allowed.");
            return;
          }

          if (role === "BOWL" && x.bowl >= 6) {
            alert("Maximum 6 Bowlers allowed.");
            return;
          }

          const team = String(p.team || "").toUpperCase();

          if (team === sides.a.code && x.sideA >= 7) {
            alert("Maximum 7 " + sides.a.code + " players allowed.");
            return;
          }

          if (team === sides.b.code && x.sideB >= 7) {
            alert("Maximum 7 " + sides.b.code + " players allowed.");
            return;
          }

          const nextCredits =
            x.credits + Number(p.credit || 0);

          if (nextCredits > 100) {
            alert(
              "Credits limit exceeded: " +
              nextCredits.toFixed(1) +
              "/100"
            );
            return;
          }

          selected.set(id,p);

          renderPlayers();
          updateHeader();
        };

        list.appendChild(card);
      });
    }

    r.querySelectorAll(".bzRoleFilter").forEach(function(btn) {
      btn.onclick = function() {
        filter = btn.dataset.role;

        r.querySelectorAll(".bzRoleFilter").forEach(function(b) {
          const active = b.dataset.role === filter;

          b.style.background = active
            ? "#24e778"
            : "#18231e";

          b.style.color = active
            ? "#061008"
            : "#fff";
        });

        renderPlayers();
      };
    });

    r.querySelector("#bzTeamNext").onclick = function() {
      const x = stats();

      if (selected.size !== 11) {
        alert("Team must contain exactly 11 players.");
        return;
      }

      // Minimum 4 and maximum 7 players from each real side.
      if (x.sideA < 4 || x.sideA > 7 ||
          x.sideB < 4 || x.sideB > 7) {
        alert(
          sides.a.code + "/" + sides.b.code +
          " combination invalid. Choose 4-7 players from each side."
        );
        return;
      }

      if (x.wk < 1 || x.wk > 4) {
        alert("Select 1 to 4 Wicket-Keepers.");
        return;
      }

      if (x.bat < 3 || x.bat > 6) {
        alert("Select 3 to 6 Batsmen.");
        return;
      }

      if (x.ar < 1 || x.ar > 4) {
        alert("Select 1 to 4 All-Rounders.");
        return;
      }

      if (x.bowl < 3 || x.bowl > 6) {
        alert("Select 3 to 6 Bowlers.");
        return;
      }

      if (x.credits > 100) {
        alert(
          "Credits limit exceeded: " +
          x.credits.toFixed(1) +
          "/100"
        );
        return;
      }

      showCaptainVC(
        match,
        contest,
        editing,
        Array.from(selected.values())
      );
    };

    updateHeader();
    renderPlayers();
  }

  function showCaptainVC(match, contest, editing, selectedPlayers) {
    const sides = matchMeta(match);
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
        const id = String(btn.dataset.c);

        if (String(vice) === id) {
          alert("Captain and Vice-Captain must be different.");
          return;
        }

        captain = id;
        refreshButtons();
      };
    });

    r.querySelectorAll("[data-vc]").forEach(function (btn) {
      btn.onclick = function () {
        const id = String(btn.dataset.vc);

        if (String(captain) === id) {
          alert("Captain and Vice-Captain must be different.");
          return;
        }

        vice = id;
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

      // ==========================================
      // BATZO HARD TEAM VALIDATION
      // ==========================================

      if (!Array.isArray(selectedPlayers) ||
          selectedPlayers.length !== 11) {
        alert("Team must contain exactly 11 players.");
        return;
      }

      const players = selectedPlayers;

      function roleCount(role) {
        return players.filter(function (p) {
          return String(p.role || "").trim().toUpperCase() === role;
        }).length;
      }

      const wk   = roleCount("WK");
      const bat  = roleCount("BAT");
      const ar   = roleCount("AR");
      const bowl = roleCount("BOWL");

      if (wk < 1 || wk > 4) {
        alert("Select 1 to 4 Wicket-Keepers.");
        return;
      }

      if (bat < 3 || bat > 6) {
        alert("Select 3 to 6 Batsmen.");
        return;
      }

      if (ar < 1 || ar > 4) {
        alert("Select 1 to 4 All-Rounders.");
        return;
      }

      if (bowl < 3 || bowl > 6) {
        alert("Select 3 to 6 Bowlers.");
        return;
      }

      // Maximum 7 players from either real match side.
      const sideA = players.filter(function (p) {
        return String(p.team || "").trim().toUpperCase() === sides.a.code;
      }).length;

      const sideB = players.filter(function (p) {
        return String(p.team || "").trim().toUpperCase() === sides.b.code;
      }).length;

      if (sideA > 7 || sideB > 7) {
        alert("Maximum 7 players allowed from one team.");
        return;
      }

      // Captain / Vice-Captain are compulsory
      if (captain === null ||
          captain === undefined ||
          String(captain) === "") {
        alert("Please select Captain.");
        return;
      }

      if (vice === null ||
          vice === undefined ||
          String(vice) === "") {
        alert("Please select Vice-Captain.");
        return;
      }

      // C and VC must be different
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
      syncTeamToBackend(match, contest, team).then(function(result) {
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
      });

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

  /* BATZO_TEAM_API_SYNC_V1 */
  async function syncTeamToBackend(match, contest, team) {
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

  function entryAmount(contest) {
    const raw =
      contest?.entry ??
      contest?.entryFee ??
      contest?.entry_fee ??
      0;

    const n = Number(
      String(raw).replace(/[^\d.]/g, "")
    );

    return Number.isFinite(n)
      ? n
      : 0;
  }

  
function showJoinConfirmation(match, contest, team) {
  const fee = entryAmount(contest);

  const r = shell(
    "Join Contest",
    matchLabel(match) + " • " + (contest.name || "Contest"),
    `
      <div style="
        padding:18px;
        border-radius:17px;
        background:#101a16;
        border:1px solid rgba(255,255,255,.10);
      ">
        <div style="
          color:#24e778;
          font-weight:900;
        ">
          SELECTED TEAM
        </div>

        <h2>${team.name || "My Team"}</h2>

        <div style="
          color:#929aa7;
          font-size:13px;
        ">
          ${Array.isArray(team.players)
            ? team.players.length
            : 0}/11 players
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
      </div>

      <button
        id="bzFinalJoin"
        type="button"
        style="
          width:100%;
          margin-top:15px;
          padding:16px;
          border:0;
          border-radius:13px;
          background:#24e778;
          color:#061008;
          font-weight:900;
        "
      >
        JOIN CONTEST • ₹${fee}
      </button>
    `
  );

  r.querySelector("#bzV11Back").onclick =
    function () {
      showMyTeams(match, contest);
    };

  r.querySelector("#bzFinalJoin").onclick =
    async function () {

      const button = this;
      button.disabled = true;
      button.textContent = "JOINING...";

      try {
        const token =
          batzoAuthToken();

        if (!token) {
          throw new Error(
            "Please login before joining a contest."
          );
        }

        const base =
          batzoApiBase();

        if (!base) {
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
            synced?.data?.message ||
            synced?.error?.message ||
            "Team could not be synced. Please try again."
          );
        }

        const response = await fetch(
          base +
          "/api/contests/" +
          encodeURIComponent(
            contest.id
          ) +
          "/join",
          {
            method:"POST",
            headers:{
              "Content-Type":
                "application/json",
              Authorization:
                "Bearer " + token
            },
            body:JSON.stringify({
              teamId: team.backendId || team.id
            })
          }
        );

        const data =
          await response.json()
            .catch(function () {
              return {};
            });

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
            "Contest join failed"
          );
        }

        alert(
          "Contest joined successfully."
        );

        await loadBatzoMyContests();

        window.BATZO_ACTIVE_CONTEST =
          contest;

        showContestDetails(contest);

      } catch (error) {
        console.warn(
          "BATZO CONTEST JOIN ERROR:",
          error
        );

        alert(
          error.message ||
          "Failed to join contest."
        );

        button.disabled = false;
        button.textContent =
          "JOIN CONTEST • ₹" + fee;
      }
    };
}




/* BATZO_WINNER_LEADERBOARD_V2 */
async function openBatzoWinnerLeaderboard(contest) {
  try {
    const contestId = contest && (contest.id || contest.contestId);

    if (!contestId) {
      alert("Contest ID not found.");
      return;
    }

    const data = await batzoMyContestsRequest(
      "/api/contests/" + encodeURIComponent(contestId) + "/leaderboard"
    );

    const leaderboard = Array.isArray(data.leaderboard)
      ? data.leaderboard
      : [];

    const rows = leaderboard.length
      ? leaderboard.map(function(entry, index) {
          const rank = entry.rank || index + 1;
          const prize = Number(entry.prize || 0);

          return `
            <div style="
              padding:14px;
              margin:8px 0;
              border-radius:14px;
              background:#101a16;
              border:1px solid rgba(255,255,255,.10);
            ">
              <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
              ">
                <strong>#${rank}</strong>
                <strong style="color:#24e778">
                  ${Number(entry.points || 0)} pts
                </strong>
              </div>

              <div style="
                margin-top:8px;
                font-size:13px;
                color:#9ca5b1;
              ">
                Status: ${entry.status || "joined"}
              </div>

              <div style="
                margin-top:5px;
                font-size:13px;
                color:#fff;
              ">
                Prize: ₹${prize}
              </div>
            </div>
          `;
        }).join("")
      : `
          <div style="
            padding:30px 10px;
            text-align:center;
            color:#9ca5b1;
          ">
            No leaderboard entries yet.
          </div>
        `;

    const r = shell(
      "Leaderboard",
      contest.name || "Contest",
      `
        <div style="
          margin-bottom:12px;
          color:#24e778;
          font-weight:900;
        ">
          LIVE CONTEST RANKING
        </div>

        ${rows}
      `
    );

    r.querySelector("#bzV11Back").onclick = function () {
      showContestDetails(contest);
    };

  } catch (error) {
    console.error("BATZO LEADERBOARD ERROR:", error);

    alert(
      error && error.message
        ? error.message
        : "Failed to load leaderboard."
    );
  }
}




/* BATZO_REAL_CONTEST_JOIN_V2 */
async function batzoJoinContestApi(match, contest, team) {
  const contestId = Number(
    contest && (contest.id || contest.contestId)
  );

  if (!contestId) {
    throw new Error("Contest ID not found.");
  }

  if (!team || !team.id) {
    throw new Error("Selected team not found.");
  }

  const result = await batzoMyContestsRequest(
    "/api/contests/" + encodeURIComponent(contestId) + "/join",
    {
      method: "POST",
      body: JSON.stringify({
        teamId:
          team.backendId || team.id
      })
    }
  );

  return result;
}


function openContests() {
    if (!currentMatch()) {
      showSelectMatchFirst();
      return;
    }

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


/* ================================================================
   BATZO_WALLET_UI_V1
   Server-authoritative wallet screen.
   No client-side balance mutation.
   ================================================================ */


/* BATZO_WALLET_AUTH_BRIDGE_V2 */
function batzoAuthToken() {
  const keys = [
    "batzo_token",
    "batzo_auth_token",
    "authToken",
    "token"
  ];

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}


/* BATZO_DEMO_CONTEST_API_V1 */
async function batzoLoadDemoContests() {
  const base = batzoApiBase();

  if (!base) {
    console.warn("[BATZO] API base URL missing; demo contests will use local fallback.");
    return [];
  }

  try {
    const response = await fetch(base + "/api/contests");
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      console.warn("[BATZO] Contest API unavailable");
      return [];
    }

    const contests = Array.isArray(data.contests)
      ? data.contests
      : [];

    return contests.map(c => ({
      ...c,
      id: c.id,
      name: c.name || c.title || "Contest",
      title: c.title || c.name || "Contest",
      entry:
        Number(c.entryFee ?? c.entry_fee ?? 0) === 0
          ? "₹0"
          : "₹" + Number(c.entryFee ?? c.entry_fee ?? 0),
      prize:
        Number(c.prizePool ?? c.prize_pool ?? 0) === 0
          ? "₹0"
          : "₹" + Number(c.prizePool ?? c.prize_pool ?? 0),
      spots:
        Number(c.maxSpots ?? c.max_spots ?? 0),
      entryFee:
        Number(c.entryFee ?? c.entry_fee ?? 0),
      practice:
        !!(c.practice || c.isPractice || c.isDemo),
      isDemo:
        !!c.isDemo
    }));
  } catch (error) {
    console.warn("[BATZO] Demo contest API fetch failed:", error);
    return [];
  }
}

function batzoApiBase() {
  const value =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL)
      : "";

  return value.replace(/\/+$/, "");
}


/* BATZO_MY_CONTESTS_API_BRIDGE_V1 */
async function batzoMyContestsRequest(path, options = {}) {
  const token = batzoAuthToken();

  if (!token) {
    const error = new Error("AUTH_REQUIRED");
    error.code = "AUTH_REQUIRED";
    error.status = 401;
    throw error;
  }

  const base = batzoApiBase();

  if (!base) {
    const error = new Error("API_BASE_URL_MISSING");
    error.code = "API_BASE_URL_MISSING";
    throw error;
  }

  const response = await fetch(base + path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const error = new Error(
      data.message || "My contests request failed"
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function loadBatzoMyContests() {
  try {
    const data = await batzoMyContestsRequest(
      "/api/my-contests"
    );

    const contests = Array.isArray(data.contests)
      ? data.contests
      : Array.isArray(data.entries)
        ? data.entries
        : [];

    window.BATZO_MY_CONTESTS = contests;

    console.log(
      "BATZO MY CONTESTS LOADED:",
      contests.length,
      contests
    );

    return contests;

  } catch (error) {
    console.warn(
      "BATZO MY CONTESTS LOAD FAILED:",
      error
    );

    window.BATZO_MY_CONTESTS = [];

    return [];
  }
}




/* BATZO_WINNER_UI_V2 */

function batzoWinnerText(entry) {
  const status = String(entry.status || "").toLowerCase();

  if (status === "winner") return "🏆 WINNER";
  if (status === "settled") return "COMPLETED";
  return "JOINED";
}

function batzoContestStatusCard(entry) {
  const points =
    entry.points !== undefined &&
    entry.points !== null
      ? Number(entry.points)
      : 0;

  const rank =
    entry.rank !== undefined &&
    entry.rank !== null
      ? "#" + entry.rank
      : "-";

  const prize =
    entry.prize !== undefined &&
    entry.prize !== null
      ? Number(entry.prize)
      : 0;

  return `
    <div style="
      margin:10px 0;
      padding:16px;
      border-radius:16px;
      background:#101a16;
      border:1px solid rgba(36,231,120,.25);
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:center;
      ">
        <strong>${entry.contestName || "Practice Contest"}</strong>
        <span style="
          color:#24e778;
          font-size:11px;
          font-weight:900;
        ">${batzoWinnerText(entry)}</span>
      </div>

      <div style="
        margin-top:7px;
        color:#929aa7;
        font-size:12px;
      ">
        ${entry.matchName || entry.match || "Match"}
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
        margin-top:15px;
        padding-top:12px;
        border-top:1px solid rgba(255,255,255,.08);
      ">
        <div>
          <div style="font-size:10px;color:#929aa7">POINTS</div>
          <strong style="color:#fff">${points}</strong>
        </div>

        <div style="text-align:center">
          <div style="font-size:10px;color:#929aa7">RANK</div>
          <strong style="color:#24e778">${rank}</strong>
        </div>

        <div style="text-align:right">
          <div style="font-size:10px;color:#929aa7">PRIZE</div>
          <strong style="color:#fff">₹${prize}</strong>
        </div>
      </div>

      <button
        type="button"
        data-bz-my-contest="${entry.contestId || entry.contest_id}"
        style="
          width:100%;
          margin-top:14px;
          padding:11px;
          border:0;
          border-radius:10px;
          background:#18231e;
          color:#24e778;
          font-weight:900;
        "
      >
        VIEW LEADERBOARD
      </button>
    </div>
  `;
}

function showBatzoMyContests() {
  const r = shell(
    "My Contests",
    currentMatch(),
    `
      <div id="bzMyContestsLoading"
        style="padding:25px;text-align:center;color:#929aa7">
        Loading contests...
      </div>

      <div id="bzMyContestsList"></div>
    `
  );

  r.querySelector("#bzV11Back").onclick = goBack;

  (async function () {
    const loading = r.querySelector("#bzMyContestsLoading");
    const list = r.querySelector("#bzMyContestsList");

    const contests = await loadBatzoMyContests();

    if (loading) loading.remove();

    if (!contests.length) {
      list.innerHTML = `
        <div style="
          text-align:center;
          padding:35px 10px;
          color:#929aa7;
        ">
          No contests joined yet.
        </div>
      `;
      return;
    }

    list.innerHTML = contests
      .map(batzoContestStatusCard)
      .join("");

    list
      .querySelectorAll("[data-bz-my-contest]")
      .forEach(function (btn) {
        btn.onclick = function () {
          showBatzoLeaderboard(
            btn.getAttribute("data-bz-my-contest")
          );
        };
      });
  })();
}

async function showBatzoLeaderboard(contestId) {
  const r = shell(
    "Leaderboard",
    "Live contest ranking",
    `
      <div id="bzLeaderboardLoading"
        style="padding:25px;text-align:center;color:#929aa7">
        Loading leaderboard...
      </div>

      <div id="bzLeaderboardList"></div>
    `
  );

  r.querySelector("#bzV11Back").onclick = goBack;

  try {
    const data = await batzoMyContestsRequest(
      "/api/contests/" + encodeURIComponent(contestId) +
      "/leaderboard"
    );

    const loading =
      r.querySelector("#bzLeaderboardLoading");

    const list =
      r.querySelector("#bzLeaderboardList");

    if (loading) loading.remove();

    const leaderboard =
      Array.isArray(data.leaderboard)
        ? data.leaderboard
        : [];

    if (!leaderboard.length) {
      list.innerHTML =
        '<div style="padding:30px;text-align:center;color:#929aa7">No leaderboard entries yet.</div>';
      return;
    }

    list.innerHTML = leaderboard.map(function (entry) {
      const rank =
        entry.rank !== undefined &&
        entry.rank !== null
          ? entry.rank
          : "-";

      return `
        <div style="
          margin:9px 0;
          padding:14px;
          border-radius:14px;
          background:#101a16;
          border:1px solid rgba(255,255,255,.09);
          display:flex;
          justify-content:space-between;
          align-items:center;
        ">
          <div>
            <strong>Rank #${rank}</strong>
            <div style="
              margin-top:5px;
              font-size:12px;
              color:#929aa7;
            ">
              ${entry.points || 0} Points
            </div>
          </div>

          <div style="
            color:#24e778;
            font-weight:900;
            font-size:12px;
          ">
            ${batzoWinnerText(entry)}
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    const loading =
      r.querySelector("#bzLeaderboardLoading");

    if (loading) {
      loading.innerHTML =
        "Failed to load leaderboard.";
    }

    console.warn(
      "BATZO LEADERBOARD ERROR:",
      error
    );
  }
}



/* BATZO_MY_CONTEST_STATUS_HELPER_V1 */
function batzoContestStatusText(entry) {

  const status =
    String(entry && entry.status || "")
      .toLowerCase();

  const points =
    Number(entry && entry.points || 0);

  const rank =
    entry && entry.rank;

  if (status === "winner") {
    return {
      label: "WINNER",
      points,
      rank: rank || 1,
      prize: Number(entry.prize || 0)
    };
  }

  if (status === "settled") {
    return {
      label: "COMPLETED",
      points,
      rank: rank || "-",
      prize: Number(entry.prize || 0)
    };
  }

  return {
    label: "JOINED",
    points,
    rank: rank || "-",
    prize: Number(entry && entry.prize || 0)
  };
}


async function batzoWalletRequest(path, options = {}) {
  const base = batzoApiBase();

  if (!base) {
    const error = new Error("API_BASE_URL_MISSING");
    error.code = "API_BASE_URL_MISSING";
    throw error;
  }

  const saveBatzoJwt = (value) => {
    const token = String(value || "").trim();

    if (!token) return "";

    try {
      localStorage.setItem("batzo_token", token);
      localStorage.setItem("batzo_auth_token", token);
    } catch (_) {}

    return token;
  };

  const storedBatzoJwt = () => {
    try {
      return String(
        localStorage.getItem("batzo_token") ||
        localStorage.getItem("batzo_auth_token") ||
        ""
      ).trim();
    } catch (_) {
      return "";
    }
  };

  const clearBatzoJwt = () => {
    try {
      localStorage.removeItem("batzo_token");
      localStorage.removeItem("batzo_auth_token");
      localStorage.removeItem("batzoToken");
    } catch (_) {}
  };

  const getFirebaseIdToken = async () => {
    /*
     * Web Firebase login
     */
    try {
      const user = auth?.currentUser;

      if (
        user &&
        typeof user.getIdToken === "function"
      ) {
        const value = await user.getIdToken(true);

        if (value) {
          return String(value).trim();
        }
      }
    } catch (error) {
      console.warn(
        "[BATZO WALLET] Web Firebase token failed:",
        error
      );
    }

    /*
     * Native Firebase login
     */
    try {
      const current =
        await FirebaseAuthentication.getCurrentUser();

      if (current?.user) {
        const result =
          await FirebaseAuthentication.getIdToken({
            forceRefresh: true
          });

        const value =
          result?.token ||
          result?.idToken ||
          "";

        if (value) {
          return String(value).trim();
        }
      }
    } catch (error) {
      console.warn(
        "[BATZO WALLET] Native Firebase token failed:",
        error
      );
    }

    return "";
  };

  const createFreshBatzoJwt = async () => {
    const idToken =
      await getFirebaseIdToken();

    if (!idToken) {
      const error =
        new Error(
          "Please login with Google to use Wallet."
        );

      error.code = "AUTH_REQUIRED";
      error.status = 401;

      throw error;
    }

    const response =
      await fetch(
        base + "/api/auth/firebase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idToken
          })
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (
      !response.ok ||
      data?.success !== true ||
      !data?.token
    ) {
      const error =
        new Error(
          data?.message ||
          data?.error ||
          "Batzo login failed."
        );

      error.code = "AUTH_REQUIRED";
      error.status = response.status || 401;

      console.error(
        "[BATZO WALLET] /api/auth/firebase failed:",
        response.status,
        data
      );

      throw error;
    }

    if (data?.user) {
      try {
        localStorage.setItem(
          "batzo_firebase_user",
          JSON.stringify(data.user)
        );
      } catch (_) {}
    }

    return saveBatzoJwt(data.token);
  };

  const callWallet = async (token) => {
    const response =
      await fetch(
        base + path,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + token
          }
        }
      );

    let data = {};

    try {
      data = await response.json();
    } catch (_) {}

    return {
      response,
      data
    };
  };

  /*
   * IMPORTANT:
   * batzo_token must contain Batzo backend JWT,
   * NOT Firebase ID token.
   */
  let token = storedBatzoJwt();

  if (!token) {
    token =
      await createFreshBatzoJwt();
  }

  let result =
    await callWallet(token);

  /*
   * Stale/invalid Batzo JWT:
   * clear it, exchange a fresh Firebase token,
   * then retry exactly once.
   */
  if (
    result.response.status === 401 ||
    result.response.status === 403
  ) {
    clearBatzoJwt();

    token =
      await createFreshBatzoJwt();

    result =
      await callWallet(token);
  }

  if (
    result.response.status === 401 ||
    result.response.status === 403
  ) {
    const error =
      new Error(
        result.data?.message ||
        result.data?.error ||
        "Authentication failed"
      );

    error.code = "AUTH_REQUIRED";
    error.status =
      result.response.status;

    throw error;
  }

  if (!result.response.ok) {
    const error =
      new Error(
        result.data?.message ||
        result.data?.error ||
        "Wallet request failed"
      );

    error.status =
      result.response.status;

    throw error;
  }

  return result.data;
}



/* BATZO STEP1 AUTH TOKEN RECOVERY */
async function batzoRecoverAuthToken() {
  /*
   * Only recover an existing BATZO BACKEND JWT.
   *
   * Do NOT copy Firebase user.idToken/token/accessToken
   * into batzo_token. Firebase ID tokens first have to be
   * exchanged through /api/auth/firebase.
   */
  try {
    const token =
      localStorage.getItem("batzo_token") ||
      localStorage.getItem("batzo_auth_token") ||
      "";

    if (token) {
      return String(token).trim();
    }
  } catch (_) {}

  try {
    const raw =
      localStorage.getItem("batzo_user") ||
      localStorage.getItem("batzoUser") ||
      "";

    if (raw) {
      const user =
        JSON.parse(raw);

      const token =
        user?.batzoToken ||
        user?.jwt ||
        "";

      if (token) {
        localStorage.setItem(
          "batzo_token",
          String(token)
        );

        return String(token);
      }
    }
  } catch (_) {}

  return "";
}



function BatzoWalletScreen() {
  const [wallet,setWallet] = React.useState(null);
  const [transactions,setTransactions] = React.useState([]);
  const [loading,setLoading] = React.useState(true);
  const [error,setError] = React.useState("");

  const loadWallet = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await batzoWalletRequest("/api/wallet");

      if (!data || data.success !== true) {
        throw new Error(
          data && data.message
            ? data.message
            : "Invalid wallet response"
        );
      }

      setWallet({
        balance: Number(data.balance || 0),
        winningBalance: Number(
          data.winningBalance ?? data.winning ?? 0
        )
      });

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }

      try {
        const txData =
          await batzoWalletRequest(
            "/api/wallet/transactions?limit=50"
          );

        setTransactions(
          Array.isArray(txData.transactions)
            ? txData.transactions
            : []
        );
      } catch (txError) {
        console.warn(
          "BATZO transaction history unavailable:",
          txError
        );
        setTransactions([]);
      }

    } catch (e) {
      console.error("BATZO WALLET ERROR:",e);

      if (
        e &&
        (
          e.code === "AUTH_REQUIRED" ||
          e.code === "AUTH_EXPIRED" ||
          e.status === 401
        )
      ) {
        setError("Please login to view your wallet.");
      } else if (
        e &&
        e.code === "API_BASE_URL_MISSING"
      ) {
        setError("Wallet API URL is not configured.");
      } else {
        setError(
          e && e.message
            ? e.message
            : "Wallet service unavailable."
        );
      }

      setWallet(null);
    } finally {
      setLoading(false);
    }
  },[]);

  React.useEffect(() => {
    loadWallet();
  },[loadWallet]);

  const balance =
    wallet && Number.isFinite(Number(wallet.balance))
      ? Number(wallet.balance)
      : 0;

  const winning =
    wallet && Number.isFinite(Number(wallet.winningBalance))
      ? Number(wallet.winningBalance)
      : 0;

  return (
    <section className="bz-wallet-page">
      <div className="bz-wallet-header">
        <div>
          <span>BATZO</span>
          <h1>Wallet</h1>
          <p>Manage your cricket balance securely.</p>
        </div>

        <button
          type="button"
          className="bz-wallet-refresh"
          onClick={loadWallet}
          disabled={loading}
          aria-label="Refresh wallet"
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div className="bz-wallet-loading">
          <strong>Loading Wallet...</strong>
          <span>Checking your secure balance.</span>
        </div>
      ) : error ? (
        <div className="bz-wallet-error">
          <b>Wallet unavailable</b>
          <span>{error}</span>
          <button type="button" onClick={loadWallet}>
            RETRY
          </button>
        </div>
      ) : (
        <>
          <div className="bz-wallet-main-card">
            <small>CURRENT BALANCE</small>
            <strong>₹{balance.toFixed(2)}</strong>
          </div>

          <div className="bz-wallet-secondary-card">
            <div>
              <small>WINNING BALANCE</small>
              <strong>₹{winning.toFixed(2)}</strong>
            </div>

            <button
              type="button"
              onClick={() => {}}
            >
              ADD MONEY
            </button>

            <button
              type="button"
              onClick={() => {}}
            >
              WITHDRAW
            </button>
          </div>

          <div className="bz-wallet-history">
            <h2>Transaction History</h2>

            {transactions.length === 0 ? (
              <div className="bz-wallet-empty">
                No transactions yet.
              </div>
            ) : (
              <div className="bz-wallet-transactions">
                {transactions.map((tx) => {
                  const amount=Number(tx.amount||0);

                  return (
                    <div
                      className="bz-wallet-tx"
                      key={tx.id || Math.random()}
                    >
                      <div>
                        <b>
                          {tx.description ||
                           tx.type ||
                           "Wallet transaction"}
                        </b>
                        <small>
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleString()
                            : ""}
                        </small>
                      </div>

                      <strong
                        className={
                          amount >= 0
                            ? "bz-wallet-positive"
                            : "bz-wallet-negative"
                        }
                      >
                        {amount >= 0 ? "+" : ""}
                        ₹{amount.toFixed(2)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ===== BATZO_WALLET_FINAL_PANEL ===== */
function BatzoWalletFinalPanel() {
  const [wallet, setWallet] = React.useState(null);
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadWallet = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await batzoWalletRequest("/api/wallet");

      if (!data || data.success !== true) {
        throw new Error(data?.message || "Wallet response invalid");
      }

      setWallet({
        balance: Number(data.balance || 0),
        winningBalance: Number(
          data.winningBalance ?? data.winning ?? 0
        )
      });

      try {
        const tx = await batzoWalletRequest(
          "/api/wallet/transactions?limit=50"
        );

        if (tx?.success === true && Array.isArray(tx.transactions)) {
          setTransactions(tx.transactions);
        } else {
          setTransactions([]);
        }
      } catch (_) {
        setTransactions([]);
      }
    } catch (e) {
      console.error("[BATZO WALLET]", e);
      setError(e?.message || "Wallet load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  if (loading) {
    return (
      <section className="batzo-wallet-final">
        <div className="batzo-wallet-card">
          <h2>💰 BATZO WALLET</h2>
          <p>Wallet loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="batzo-wallet-final"
      style={{
        marginTop: "22px",
        padding: "0 4px 24px"
      }}
    >
      <div
        className="batzo-wallet-card"
        style={{
          border: "1px solid rgba(0,255,140,.28)",
          borderRadius: "22px",
          padding: "20px",
          background: "linear-gradient(145deg,#10151b,#07090d)",
          boxShadow: "0 10px 35px rgba(0,0,0,.35)"
        }}
      >
        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:"18px"
        }}>
          <div>
            <div style={{
              color:"#32f58a",
              fontSize:"12px",
              fontWeight:"800",
              letterSpacing:"2px"
            }}>
              BATZO
            </div>
            <h2 style={{margin:"4px 0 0",fontSize:"24px"}}>
              💰 Wallet
            </h2>
          </div>

          <button
            onClick={loadWallet}
            style={{
              border:"1px solid rgba(255,255,255,.18)",
              borderRadius:"12px",
              background:"#11161d",
              color:"#fff",
              padding:"9px 13px",
              fontWeight:"700"
            }}
          >
            ↻
          </button>
        </div>

        {error ? (
          <div style={{
            padding:"14px",
            borderRadius:"14px",
            background:"rgba(255,60,60,.10)",
            border:"1px solid rgba(255,80,80,.25)",
            color:"#ff9b9b",
            marginBottom:"15px"
          }}>
            {error}
          </div>
        ) : null}

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          gap:"12px"
        }}>
          <div style={{
            padding:"17px",
            borderRadius:"17px",
            background:"#151b22"
          }}>
            <div style={{fontSize:"11px",color:"#8e99a6"}}>
              CURRENT BALANCE
            </div>
            <div style={{
              fontSize:"26px",
              fontWeight:"900",
              marginTop:"7px"
            }}>
              ₹{Number(wallet?.balance || 0).toFixed(2)}
            </div>
          </div>

          <div style={{
            padding:"17px",
            borderRadius:"17px",
            background:"#151b22"
          }}>
            <div style={{fontSize:"11px",color:"#8e99a6"}}>
              WINNING BALANCE
            </div>
            <div style={{
              fontSize:"26px",
              fontWeight:"900",
              marginTop:"7px"
            }}>
              ₹{Number(wallet?.winningBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          gap:"10px",
          marginTop:"14px"
        }}>
          <button
            onClick={() => {}}
            style={{
              padding:"14px",
              border:0,
              borderRadius:"14px",
              background:"#25e878",
              color:"#06120b",
              fontWeight:"900",
              fontSize:"15px"
            }}
          >
            ＋ ADD MONEY
          </button>

          <button
            onClick={() => {}}
            style={{
              padding:"14px",
              border:"1px solid rgba(255,255,255,.18)",
              borderRadius:"14px",
              background:"#11161d",
              color:"#fff",
              fontWeight:"900",
              fontSize:"15px"
            }}
          >
            ↗ WITHDRAW
          </button>
        </div>

        <div style={{marginTop:"22px"}}>
          <h3 style={{margin:"0 0 12px"}}>
            Transaction History
          </h3>

          {transactions.length === 0 ? (
            <div style={{
              padding:"17px",
              borderRadius:"15px",
              background:"#10151b",
              color:"#89939f",
              textAlign:"center"
            }}>
              No transactions yet
            </div>
          ) : (
            <div style={{
              display:"flex",
              flexDirection:"column",
              gap:"8px"
            }}>
              {transactions.slice(0,10).map((tx, i) => (
                <div
                  key={tx.id || tx.reference || i}
                  style={{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                    padding:"13px 14px",
                    borderRadius:"13px",
                    background:"#10151b"
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight:"800",
                      textTransform:"capitalize"
                    }}>
                      {String(tx.type || "transaction").replace("_"," ")}
                    </div>
                    <small style={{color:"#7f8995"}}>
                      {tx.status || "pending"}
                    </small>
                  </div>

                  <strong>
                    ₹{Number(tx.amount || 0).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
/* ===== END BATZO_WALLET_FINAL_PANEL ===== */


function App() {


  // BATZO_SINGLE_ANDROID_BACK_V3
  useEffect(() => {
    let handle = null;
    let alive = true;
    let processing = false;

    const onAndroidBack = async () => {
      if (!alive || processing) return;
      processing = true;
      
      // Account Settings gets the physical Android Back event first.
      const accountBack = document.querySelector(
        '[data-batzo-account-back="1"]'
      );
      if (accountBack) {
        accountBack.click();
        setTimeout(() => {
          processing = false;
        }, 300);
        return;
      }


      try {
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

        // First: authentication/inner-screen navigation.
        if (
          typeof window.__BATZO_AUTH_BACK__ === "function" &&
          window.__BATZO_AUTH_BACK__() === true
        ) {
          return;
        }

        // Second: normal Batzo page/tab navigation.
        if (
          typeof window.__BATZO_FLOW_BACK__ === "function" &&
          window.__BATZO_FLOW_BACK__() === true
        ) {
          return;
        }

        /*
         * Final SPA fallback.
         * NEVER replay browser history.
         * Non-home Batzo tabs return directly Home.
         */
        window.dispatchEvent(
          new Event("batzo-native-back")
        );
      } catch (err) {
        console.warn("BATZO Android Back error:", err);
      } finally {
        setTimeout(() => {
          processing = false;
        }, 300);
      }
    };

    CapacitorApp.addListener("backButton", onAndroidBack).then((h) => {
      if (alive) {
        handle = h;
      } else if (h && typeof h.remove === "function") {
        h.remove();
      }
    });

    return () => {
      alive = false;
      if (handle && typeof handle.remove === "function") {
        handle.remove();
      }
    };
  }, []);

return (
    <AuthGate>
      <BatzoApp />
    </AuthGate>
  );
}

export default App;












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
