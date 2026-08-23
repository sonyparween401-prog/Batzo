import React, { useMemo, useState } from "react";
import "./App.css";

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
      <div className="batzo-logo">
        <span>B</span><span>A</span><span>T</span><span>Z</span><span>O</span>
      </div>
      <div className="logo-line">
        <i></i>
        <strong>CRICKET HUB</strong>
        <i></i>
      </div>
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

export default function App() {
  const [tab, setTab] = useState("home");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const openMatch = (match) => {
    setNotice(`${match.a} vs ${match.b} — Match Centre`);
    setTab("matches");
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
    setNotice(`${name} section is ready for the next Batzo release.`);
  };

  const goHome = () => {
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="batzo-app">
      <Header setNotice={setNotice} />

      <main className="main-content">
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

            <section className="quick-grid">
              <QuickCard
                icon="🏏"
                title="Matches"
                sub="Live & upcoming"
                type="green-card"
                onClick={() => setTab("matches")}
              />
              <QuickCard
                icon="🏆"
                title="My Contests"
                sub="Track entries"
                type="gold-card"
                onClick={() => setTab("contests")}
              />
              <QuickCard
                icon="👥"
                title="My Teams"
                sub="Build your XI"
                type="blue-card"
                onClick={() => setTab("teams")}
              />
              <QuickCard
                icon="🎁"
                title="Rewards"
                sub="Coming soon"
                type="pink-card"
                onClick={() => showComing("Rewards")}
              />
            </section>

            <section className="section-block">
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

            <section className="section-block">
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
                <button onClick={() => setTab("contests")}>View all →</button>
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
          <small>Contests</small>
        </button>

        <button
          className={tab === "teams" ? "active" : ""}
          onClick={() => setTab("teams")}
        >
          <span>👥</span>
          <small>My Teams</small>
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
