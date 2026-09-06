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
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { GoogleAuthProvider, RecaptchaVerifier, signInWithPopup, linkWithPopup, signInWithPhoneNumber, linkWithPhoneNumber as webLinkWithPhoneNumber, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import "./App.css";
import { installJoinFlow } from "./services/join-flow-ui";

import AuthGate from "./AuthGate";
import { getLiveMatches } from "./services/cricketService.js";

function batzoLiveAdapter(m) {
  const teams = Array.isArray(m?.teams) ? m.teams : [];
  const info = Array.isArray(m?.teamInfo) ? m.teamInfo : [];
  const score = Array.isArray(m?.score) ? m.score : [];

  const teamA = info[0] || {};
  const teamB = info[1] || {};

  const current =
    score.length > 0
      ? score[score.length - 1]
      : {};

  const code = (team, fallback) =>
    String(team?.shortname || fallback || "")
      .toUpperCase()
      .slice(0, 4);

  return {
    id: m?.id || `${m?.name || "match"}-${m?.date || ""}`,
    raw: m,
    status: "LIVE",
    league: m?.name || m?.matchType || "Cricket",

    a: teamA?.name || teams[0] || "Team A",
    ac: code(teamA, teams[0]),
    af: "🏏",

    b: teamB?.name || teams[1] || "Team B",
    bc: code(teamB, teams[1]),
    bf: "🏏",

    as: current?.r != null
      ? `${current.r}/${current.w ?? 0}`
      : "-",

    bs: m?.status || "LIVE",

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


const liveMatches = [
  {
    id: 1,
    league: "T20 International",
    status: "LIVE",
    a: "India",
    ac: "IND",
    af: "🇮🇳",
    as: "168/4",
    b: "Australia",
    bc: "AUS",
    bf: "🇦🇺",
    bs: "142/7",
    over: "17.2 ov",
    viewers: "2.1L people watching",

    innings: {
      battingTeam: "India",
      bowlingTeam: "Australia",
      score: "168/4",
      overs: "17.2",
      runRate: "9.69",
      target: "201",
      need: "33 runs from 16 balls"
    },

    batsmen: [
      { name: "Virat Kohli", runs: 72, balls: 48, fours: 6, sixes: 3, strikeRate: "150.00", status: "not out" },
      { name: "Hardik Pandya", runs: 31, balls: 18, fours: 2, sixes: 2, strikeRate: "172.22", status: "not out" }
    ],

    bowlers: [
      { name: "Pat Cummins", overs: "4", runs: 32, wickets: 1, economy: "8.00" },
      { name: "Mitchell Starc", overs: "3.2", runs: 41, wickets: 2, economy: "12.30" }
    ],

    recentBalls: ["1", "4", "1", "6", "W", "2"],
    lastUpdated: "Live now"
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


function LiveScoreboard({ match, onBack }) {
  if (!match) return null;

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
        <span>🔴 LIVE SCOREBOARD</span>
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
              {inn.score || match.as}
            </div>
            <small>{inn.overs || match.over} overs</small>
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
          <strong>🎯 Target: {inn.target || "-"}</strong>
          <div style={{ marginTop: "6px", color: "#32f58a" }}>
            {inn.need || "Live score updating..."}
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

  const [selectedLiveMatch, setSelectedLiveMatch] = useState(null);
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
    /* batzo-master-navigate-fix */
    const previousTab = tab;
    
    if (!nextTab || nextTab === tab) return;

    batzoTabHistory.current.push(tab);
    batzoPreviousTab.current = tab;
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };



  const [notice, setNotice] = useState("");
  const [realLiveMatches, setRealLiveMatches] = useState([]);
  const [realUpcomingMatches, setRealUpcomingMatches] = useState([]);
  const [search, setSearch] = useState("");


  useEffect(() => {
    let cancelled = false;

    const loadRealMatches = async () => {
      try {
        const response = await fetch(
          "https://batzo.onrender.com/api/cricket/matches",
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Cricket API HTTP ${response.status}`);
        }

        const payload = await response.json();

        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const liveRows = rows
          .filter(
            (m) =>
              m?.matchStarted === true &&
              m?.matchEnded !== true
          )
          .map((m) =>
            batzoLiveAdapter({
              ...m,
              status: "LIVE"
            })
          );

        const upcomingRows = rows
          .filter(
            (m) =>
              m?.matchStarted !== true &&
              m?.matchEnded !== true
          )
          .map((m, index) => {
            const teams = Array.isArray(m?.teams) ? m.teams : [];
            const a = teams[0] || "Team 1";
            const b = teams[1] || "Team 2";

            const teamInfo = Array.isArray(m?.teamInfo)
              ? m.teamInfo
              : [];

            const metaA =
              teamInfo.find((t) => t?.name === a) || {};
            const metaB =
              teamInfo.find((t) => t?.name === b) || {};

            const shortName = (name, meta) => {
              if (meta?.shortname) return meta.shortname;

              return String(name || "")
                .split(/\s+/)
                .filter(Boolean)
                .map((word) => word[0])
                .join("")
                .slice(0, 4)
                .toUpperCase() || "TEAM";
            };

            let startDate = null;

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

                const parsed = new Date(normalized);

                if (!Number.isNaN(parsed.getTime())) {
                  startDate = parsed;
                }
              }
            } catch (_) {}

            return {
              id: m?.id || `real-upcoming-${index}`,
              league:
                m?.name ||
                String(m?.matchType || "CRICKET").toUpperCase(),

              a,
              ac: shortName(a, metaA),
              af: "🏏",

              b,
              bc: shortName(b, metaB),
              bf: "🏏",

              time: startDate
                ? startDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short"
                  })
                : "Upcoming",

              clock: startDate
                ? startDate.toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit"
                  })
                : "TBA",

              status: "UPCOMING",
              raw: m
            };
          });

        if (!cancelled) {
          setRealLiveMatches(liveRows);
          setRealUpcomingMatches(upcomingRows);
        }
      } catch (error) {
        console.warn("BATZO real cricket refresh:", error);
      }
    };

    loadRealMatches();

    // Lifetime Free API has a small daily hit allowance.
    // Refresh every 30 minutes; backend cache protects provider hits too.
    const timer = setInterval(
      loadRealMatches,
      30 * 60 * 1000
    );

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const displayLiveMatches = realLiveMatches;

  const displayUpcomingMatches = realUpcomingMatches;

  const openMatch = (match) => {
    try {
      // Live matches open the dedicated scoreboard.
      if (String(match?.status || "").toUpperCase() === "LIVE" || match?.innings) {
        batzoTabHistory.current.push(tab);
        batzoPreviousTab.current = tab;
        setSelectedLiveMatch(match);
        setTab("live-scoreboard");
        window.scrollTo({ top: 0, behavior: "smooth" });
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

      setSelectedMatch?.(match);
      setTab("contests");
    } catch (e) {
      console.warn("BATZO match flow:", e);
      setTab("contests");
    }
  };

  const upcomingFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayUpcomingMatches;

    return displayUpcomingMatches.filter((m) =>
      `${m.a} ${m.b} ${m.ac} ${m.bc} ${m.league}`
        .toLowerCase()
        .includes(q)
    );
  }, [search, displayUpcomingMatches]);

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
    if (tab !== "home") {
      batzoTabHistory.current.push(tab);
    }
    batzoPreviousTab.current = "home";
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

            <div className="match-section-title upcoming-title">
              UPCOMING
            </div>

            <div className="upcoming-list">
              {upcomingFiltered.length > 0 ? (
                upcomingFiltered.map((m) => (
                  <UpcomingCard
                    key={m.id}
                    match={m}
                    onOpen={openMatch}
                  />
                ))
              ) : (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    opacity: 0.7
                  }}
                >
                  No upcoming real matches available right now.
                </div>
              )}
            </div>
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
  /* BATZO_DEMO_CONTEST_FRONTEND_V1 */

  const contests = [
    {
      id: 900001,
      name: "BATZO FREE DEMO CONTEST",
      title: "BATZO FREE DEMO CONTEST",
      match: "BATZO DEMO: INDIA vs AUSTRALIA",
      matchName: "BATZO DEMO: INDIA vs AUSTRALIA",
      matchId: 3,
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
    const demoContest = {
      id: "batzo-free-demo-visible",
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
      match: "BATZO DEMO: INDIA vs AUSTRALIA",
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

        
        window.BATZO_SELECTED_TEAM = team;

        batzoRequireLogin(() => {
          showJoinConfirmation(match, contest, team);
        });

      };
    }
  }

  function showTeamBuilder(match, contest, editing) {
    const ps = players();

    if (!Array.isArray(ps) || !ps.length) {
      alert("Player list is not available.");
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
      "IND vs AUS • Select your Fantasy XI",
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
            <strong id="bzTeamCount">IND 0 • AUS 0</strong>
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
          ">🇮🇳 INDIA</div>

          <div style="
            padding:9px;
            border-radius:10px;
            background:#16261e;
            text-align:center;
            font-weight:800;
          ">🇦🇺 AUSTRALIA</div>
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

      const ind = arr.filter(function(p) {
        return String(p.team || "").toUpperCase() === "IND";
      }).length;

      const aus = arr.filter(function(p) {
        return String(p.team || "").toUpperCase() === "AUS";
      }).length;

      const credits = arr.reduce(function(total,p) {
        return total + Number(p.credit || 0);
      },0);

      return {wk,bat,ar,bowl,ind,aus,credits};
    }

    function updateHeader() {
      const x = stats();

      r.querySelector("#bzPlayerCount").textContent =
        "SELECTED: " + selected.size + "/11";

      r.querySelector("#bzTeamCount").textContent =
        "IND " + x.ind + " • AUS " + x.aus;

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

          if (team === "IND" && x.ind >= 7) {
            alert("Maximum 7 IND players allowed.");
            return;
          }

          if (team === "AUS" && x.aus >= 7) {
            alert("Maximum 7 AUS players allowed.");
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

      // IND/AUS combination:
      // minimum 4 from each side, maximum 7 from each side.
      // 5 IND + 6 AUS is valid.
      if (x.ind < 4 || x.ind > 7 ||
          x.aus < 4 || x.aus > 7) {
        alert(
          "IND/AUS combination invalid. " +
          "Choose 4-7 players from each side. " +
          "Example: 5 IND + 6 AUS."
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

      // IND vs AUS maximum 7 from either side
      const ind = players.filter(function (p) {
        return String(p.team || "").trim().toUpperCase() === "IND";
      }).length;

      const aus = players.filter(function (p) {
        return String(p.team || "").trim().toUpperCase() === "AUS";
      }).length;

      if (ind > 7 || aus > 7) {
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
        if (result.ok) {
          console.log("BATZO: Team Builder backend sync PASS");
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
      const token =
        localStorage.getItem("batzo_token") ||
        localStorage.getItem("batzo_auth_token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        console.warn("BATZO: no JWT token; keeping local team only.");
        return { ok:false, skipped:true };
      }

      const matchId = Number(
        match && (match.id || match.match_id)
      );

      if (!matchId) {
        console.warn("BATZO: match id missing; keeping local team.");
        return { ok:false, skipped:true };
      }

      const players = Array.isArray(team.players)
        ? team.players
        : [];

      const response = await fetch("/api/teams", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":"Bearer " + token
        },
        body:JSON.stringify({
          match_id:matchId,
          team_name:team.name || team.team_name || "Team",
          players,
          captainId:team.captainId,
          viceCaptainId:team.viceCaptainId
        })
      });

      const data = await response.json().catch(function(){
        return {};
      });

      if (!response.ok || !data.success) {
        console.warn(
          "BATZO: backend team sync failed:",
          data.message || data.error || response.status
        );
        return {
          ok:false,
          status:response.status,
          data
        };
      }

      console.log(
        "BATZO: team synced to backend:",
        data.team && data.team.id
      );

      return {
        ok:true,
        team:data.team
      };

    } catch(error) {
      console.warn(
        "BATZO: backend unavailable; local team retained.",
        error
      );

      return {
        ok:false,
        error
      };
    }
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
        teamId: team.id
      })
    }
  );

  return result;
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
  let token =
      localStorage.getItem("batzo_token") ||
      localStorage.getItem("batzoToken") ||
      localStorage.getItem("token") ||
      "";

    if (!token) {
      token = await batzoRecoverAuthToken();
    }

  // If the Batzo JWT is missing, recover it from the
  // currently authenticated Firebase user.
  if (!token) {
    try {
      let idToken = null;
      let firebaseUser = auth.currentUser || null;

      // Web Firebase user
      if (
        firebaseUser &&
        typeof firebaseUser.getIdToken === "function"
      ) {
        idToken = await firebaseUser.getIdToken(true);
      }

      // Native Capacitor Firebase user/token
      if (!idToken) {
        try {
          const nativeUser =
            await FirebaseAuthentication.getCurrentUser();

          if (nativeUser?.user) {
            firebaseUser = nativeUser.user;
          }
        } catch (_) {}

        try {
          const tokenResult =
            await FirebaseAuthentication.getIdToken({
              forceRefresh: true
            });

          idToken = tokenResult?.token || null;
        } catch (nativeTokenError) {
          console.warn(
            "[BATZO] Native Firebase ID token unavailable:",
            nativeTokenError
          );
        }
      }

      // Exchange Firebase ID token for Batzo JWT
      if (idToken) {
        const base = batzoApiBase();

        if (!base) {
          throw new Error("API_BASE_URL_MISSING");
        }

        const syncResponse = await fetch(
          base + "/api/auth/firebase",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken })
          }
        );

        const syncData =
          await syncResponse.json().catch(() => ({}));

        if (
          syncResponse.ok &&
          syncData.success &&
          syncData.token
        ) {
          token = String(syncData.token).trim();

          try {
            localStorage.setItem("batzo_token", token);
          } catch (_) {}

          try {
            localStorage.setItem("batzo_auth_token", token);
          } catch (_) {}
          if (syncData.user) {
            try {
              localStorage.setItem(
                "batzo_firebase_user",
                JSON.stringify(syncData.user)
              );
            } catch (_) {}
          }
        } else {
          console.warn(
            "[BATZO] Firebase-to-Batzo sync failed:",
            syncData
          );
        }
      }
    } catch (refreshError) {
      console.warn(
        "[BATZO] Wallet Firebase token recovery:",
        refreshError
      );
    }
  }

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

  const headers = {
    ...(options.headers || {}),
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };

  const response = await fetch(base + path, {
    ...options,
    headers
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_) {}

  if (response.status === 401) {
    const error = new Error(
      data.message || data.error || "Authentication failed"
    );
    error.code = "AUTH_EXPIRED";
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      data.message || data.error || "Wallet request failed"
    );
    error.status = response.status;
    throw error;
  }

  return data;
}









/* BATZO STEP1 AUTH TOKEN RECOVERY */
async function batzoRecoverAuthToken() {
  let token =
    localStorage.getItem("batzo_token") ||
    localStorage.getItem("batzoToken") ||
    localStorage.getItem("token") ||
    "";

  if (token) return token;

  const userJson =
    localStorage.getItem("batzo_user") ||
    localStorage.getItem("batzoUser") ||
    localStorage.getItem("user");

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      token =
        user?.token ||
        user?.jwt ||
        user?.accessToken ||
        "";

      if (token) {
        localStorage.setItem("batzo_token", token);
        return token;
      }
    } catch (_) {}
  }

  try {
    if (
      typeof FirebaseAuthentication !== "undefined" &&
      FirebaseAuthentication &&
      typeof FirebaseAuthentication.getCurrentUser === "function"
    ) {
      const current = await FirebaseAuthentication.getCurrentUser();

      if (current && current.user) {
        token =
          current.user.idToken ||
          current.user.token ||
          current.user.accessToken ||
          "";

        if (token) {
          localStorage.setItem("batzo_token", token);
          return token;
        }
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
              onClick={() =>
                alert(
                  "Add Money will be enabled after verified payment-gateway integration."
                )
              }
            >
              ADD MONEY
            </button>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Withdrawals are available through eligible winning balance."
                )
              }
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
            onClick={() =>
              alert("Add Money will be enabled after verified payment-gateway integration.")
            }
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
            onClick={() =>
              alert("Withdrawals are available through eligible winning balance.")
            }
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

        // Final SPA fallback.
        if (window.history.length > 1) {
          window.history.back();
        }
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
