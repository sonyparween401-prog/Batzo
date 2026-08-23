import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const upcoming = [
  { id: 1, league: "T20", time: "Today • 7:30 PM", a: "India", ac: "IND", b: "Australia", bc: "AUS", tag: "MEGA CONTEST" },
  { id: 2, league: "T20", time: "Tomorrow • 3:30 PM", a: "England", ac: "ENG", b: "South Africa", bc: "SA", tag: "HOT CONTEST" },
  { id: 3, league: "T20", time: "Tomorrow • 7:30 PM", a: "Pakistan", ac: "PAK", b: "New Zealand", bc: "NZ", tag: "POPULAR" }
];

const live = [
  { id: 11, league: "LIVE • T20", time: "2nd Innings", a: "India", ac: "IND", as: "168/4", b: "Australia", bc: "AUS", bs: "142/7", over: "17.2 ov" }
];

const contests = [
  { title: "Mega Contest", prize: "₹50 Lakhs", spots: "2.1L", entry: "₹49" },
  { title: "Head to Head", prize: "₹1,800", spots: "2", entry: "₹49" },
  { title: "Small Contest", prize: "₹25,000", spots: "1,000", entry: "₹99" }
];

function TeamBadge({ code }) {
  return <div className="team-badge">{code}</div>;
}

function MatchCard({ match, isLive = false, onOpen }) {
  return (
    <button className="match-card" onClick={() => onOpen(match)}>
      <div className="match-top">
        <span>{match.league}</span>
        <span className={isLive ? "live-dot" : "match-time"}>{isLive ? "● LIVE" : match.time}</span>
      </div>

      <div className="teams">
        <div className="team">
          <TeamBadge code={match.ac} />
          <strong>{match.a}</strong>
          {isLive && <b>{match.as}</b>}
        </div>

        <div className="vs">VS</div>

        <div className="team">
          <TeamBadge code={match.bc} />
          <strong>{match.b}</strong>
          {isLive && <b>{match.bs}</b>}
        </div>
      </div>

      {isLive ? (
        <div className="match-bottom">
          <span>{match.over}</span>
          <span className="join-live">VIEW MATCH →</span>
        </div>
      ) : (
        <div className="match-bottom">
          <span>{match.tag}</span>
          <span className="join-live">VIEW CONTESTS →</span>
        </div>
      )}
    </button>
  );
}

function ContestCard({ contest }) {
  return (
    <button className="contest-card">
      <div>
        <span className="contest-label">WINNING PRIZE</span>
        <strong>{contest.prize}</strong>
      </div>
      <div className="contest-mid">
        <b>{contest.title}</b>
        <span>{contest.spots} spots</span>
      </div>
      <div className="entry">
        <span>JOIN</span>
        <b>₹{contest.entry.replace("₹", "")}</b>
      </div>
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [notice, setNotice] = useState("");
  const [wallet] = useState("₹0");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "BATZO • Cricket Hub";
  }, []);

  const filteredUpcoming = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return upcoming;
    return upcoming.filter(
      m =>
        m.a.toLowerCase().includes(q) ||
        m.b.toLowerCase().includes(q) ||
        m.league.toLowerCase().includes(q)
    );
  }, [search]);

  const openMatch = match => {
    setNotice(`${match.a} vs ${match.b} — Match Centre`);
    setTab("matches");
  };

  const comingSoon = name => {
    setNotice(`${name} is ready for the next Batzo release.`);
  };

  return (
    <div className="batzo-app">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand">BATZO</div>
            <div className="brand-sub">CRICKET HUB</div>
          </div>
        </div>

        <div className="top-actions">
          <button className="icon-btn" onClick={() => comingSoon("Notifications")} aria-label="Notifications">♢</button>
          <button className="wallet-btn" onClick={() => comingSoon("Wallet")}>
            <span>Wallet</span>
            <b>{wallet}</b>
          </button>
        </div>
      </header>

      <main className="content">
        {notice && (
          <button className="notice" onClick={() => setNotice("")}>
            <span>{notice}</span><b>×</b>
          </button>
        )}

        {tab === "home" && (
          <>
            <section className="hero">
              <div className="hero-glow" />
              <div className="hero-copy">
                <span className="eyebrow">THE NEW CRICKET EXPERIENCE</span>
                <h1>Play smart.<br /><em>Play Batzo.</em></h1>
                <p>Create your best XI, join contests and follow every ball.</p>
                <button className="primary-btn" onClick={() => setTab("matches")}>
                  EXPLORE MATCHES <span>→</span>
                </button>
              </div>
              <div className="hero-ball">🏏</div>
            </section>

            <section className="quick-grid">
              <button onClick={() => setTab("matches")}><span>🏏</span><b>Matches</b><small>Live & upcoming</small></button>
              <button onClick={() => comingSoon("My Contests")}><span>🏆</span><b>My Contests</b><small>Track entries</small></button>
              <button onClick={() => comingSoon("My Teams")}><span>👥</span><b>My Teams</b><small>Build your XI</small></button>
              <button onClick={() => comingSoon("Rewards")}><span>🎁</span><b>Rewards</b><small>Coming soon</small></button>
            </section>

            <section className="section">
              <div className="section-head">
                <div><span className="section-kicker">PLAY NOW</span><h2>Live Matches</h2></div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>
              {live.map(match => <MatchCard key={match.id} match={match} isLive onOpen={openMatch} />)}
            </section>

            <section className="section">
              <div className="section-head">
                <div><span className="section-kicker">DON'T MISS OUT</span><h2>Upcoming Matches</h2></div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>
              <div className="match-list">
                {upcoming.slice(0, 2).map(match => <MatchCard key={match.id} match={match} onOpen={openMatch} />)}
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div><span className="section-kicker">TOP PICKS</span><h2>Popular Contests</h2></div>
                <button onClick={() => comingSoon("All Contests")}>View all →</button>
              </div>
              <div className="contest-list">
                {contests.map((contest, i) => <ContestCard key={i} contest={contest} />)}
              </div>
            </section>

            <section className="trust-strip">
              <span>✓</span><div><b>Built for cricket fans</b><small>Simple contests • Clear match data • Fast experience</small></div>
            </section>
          </>
        )}

        {tab === "matches" && (
          <section className="page">
            <div className="page-title">
              <span className="section-kicker">BATZO CRICKET</span>
              <h1>Matches</h1>
              <p>Choose a match and enter the action.</p>
            </div>
            <div className="search-box">
              <span>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams or matches" />
            </div>
            <h3 className="list-title">LIVE</h3>
            {live.map(match => <MatchCard key={match.id} match={match} isLive onOpen={openMatch} />)}
            <h3 className="list-title">UPCOMING</h3>
            {filteredUpcoming.map(match => <MatchCard key={match.id} match={match} onOpen={openMatch} />)}
          </section>
        )}

        {tab === "contests" && (
          <section className="page">
            <div className="page-title">
              <span className="section-kicker">COMPETE</span>
              <h1>Contests</h1>
              <p>Pick your format and play your way.</p>
            </div>
            {contests.map((contest, i) => <ContestCard key={i} contest={contest} />)}
            <div className="empty-card">Your joined contests will appear here.</div>
          </section>
        )}

        {tab === "teams" && (
          <section className="page centered-page">
            <div className="big-icon">👥</div>
            <span className="section-kicker">YOUR SQUADS</span>
            <h1>My Teams</h1>
            <p>Create and manage your fantasy cricket teams here.</p>
            <button className="primary-btn" onClick={() => comingSoon("Team Builder")}>CREATE TEAM →</button>
          </section>
        )}

        {tab === "profile" && (
          <section className="page centered-page">
            <div className="profile-avatar">B</div>
            <span className="section-kicker">BATZO ACCOUNT</span>
            <h1>Your Profile</h1>
            <p>Profile, wallet and account settings will live here.</p>
            <button className="secondary-btn" onClick={() => comingSoon("Profile settings")}>ACCOUNT SETTINGS</button>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {[
          ["home", "⌂", "Home"],
          ["matches", "🏏", "Matches"],
          ["contests", "🏆", "Contests"],
          ["teams", "👥", "My Teams"],
          ["profile", "◉", "Profile"]
        ].map(([id, icon, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <span>{icon}</span><small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
