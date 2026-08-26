import React, { useState } from "react";
import "./App.css";

const matches = [
  {
    id: 1,
    status: "LIVE",
    time: "LIVE NOW",
    team1: "Mumbai Indians",
    short1: "MI",
    score1: "168/5",
    team2: "Chennai Super Kings",
    short2: "CSK",
    score2: "142/6",
    overs: "17.4 / 20 OV",
    result: "MI need 24 runs from 14 balls",
    venue: "Wankhede Stadium",
    prize: "₹25 Lakhs",
  },
  {
    id: 2,
    status: "UPCOMING",
    time: "7:30 PM",
    team1: "Royal Challengers Bengaluru",
    short1: "RCB",
    score1: "",
    team2: "Kolkata Knight Riders",
    short2: "KKR",
    score2: "",
    overs: "",
    result: "Match starts at 7:30 PM",
    venue: "M. Chinnaswamy Stadium",
    prize: "₹50 Lakhs",
  },
  {
    id: 3,
    status: "UPCOMING",
    time: "Tomorrow • 3:30 PM",
    team1: "Rajasthan Royals",
    short1: "RR",
    score1: "",
    team2: "Delhi Capitals",
    short2: "DC",
    score2: "",
    overs: "",
    result: "Match starts tomorrow",
    venue: "Sawai Mansingh Stadium",
    prize: "₹20 Lakhs",
  },
];

function TeamBadge({ short }) {
  return <div className="team-badge">{short}</div>;
}

function MatchCard({ match, onOpen }) {
  return (
    <button className="match-card" onClick={() => onOpen(match)}>
      <div className="match-card-top">
        <span className={match.status === "LIVE" ? "live-pill" : "upcoming-pill"}>
          {match.status === "LIVE" ? "● LIVE" : "UPCOMING"}
        </span>
        <span className="match-time">{match.time}</span>
      </div>

      <div className="teams-row">
        <div className="team-block">
          <TeamBadge short={match.short1} />
          <div className="team-name">{match.team1}</div>
          {match.score1 && <div className="team-score">{match.score1}</div>}
        </div>

        <div className="versus">VS</div>

        <div className="team-block">
          <TeamBadge short={match.short2} />
          <div className="team-name">{match.team2}</div>
          {match.score2 && <div className="team-score">{match.score2}</div>}
        </div>
      </div>

      <div className="match-result">{match.result}</div>

      <div className="card-footer">
        <span>🏆 Prize Pool {match.prize}</span>
        <strong>VIEW MATCH →</strong>
      </div>
    </button>
  );
}

function MatchDetails({ match, onBack }) {
  const [active, setActive] = useState("overview");

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="back-button" onClick={onBack}>←</button>
        <div>
          <div className="brand-small">BATZO</div>
          <div className="topbar-title">Match Center</div>
        </div>
        <div className={match.status === "LIVE" ? "live-dot" : "green-dot"} />
      </header>

      <main className="page details-page">
        <div className="details-hero">
          <div className={match.status === "LIVE" ? "live-pill large" : "upcoming-pill large"}>
            {match.status === "LIVE" ? "● LIVE MATCH" : "UPCOMING MATCH"}
          </div>

          <div className="details-teams">
            <div>
              <TeamBadge short={match.short1} />
              <h2>{match.team1}</h2>
              <div className="big-score">{match.score1 || "—"}</div>
            </div>

            <div className="details-vs">VS</div>

            <div>
              <TeamBadge short={match.short2} />
              <h2>{match.team2}</h2>
              <div className="big-score">{match.score2 || "—"}</div>
            </div>
          </div>

          <p className="details-result">{match.result}</p>
        </div>

        <div className="action-grid">
          <button onClick={() => setActive("contests")}>
            <span>🏆</span>
            <b>CONTESTS</b>
            <small>Join contests</small>
          </button>

          <button onClick={() => setActive("team")}>
            <span>👥</span>
            <b>MY TEAM</b>
            <small>Create your team</small>
          </button>

          <button onClick={() => setActive("score")}>
            <span>📊</span>
            <b>LIVE SCORE</b>
            <small>Ball-by-ball</small>
          </button>

          <button onClick={() => setActive("info")}>
            <span>ℹ️</span>
            <b>MATCH INFO</b>
            <small>Venue & details</small>
          </button>
        </div>

        <section className="content-panel">
          {active === "overview" && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="small-label">MATCH CENTER</span>
                  <h3>Choose your action</h3>
                </div>
                <span className="panel-icon">🏏</span>
              </div>

              <button className="primary-action" onClick={() => setActive("contests")}>
                JOIN CONTEST
              </button>

              <div className="info-row">
                <span>🏆 Prize Pool</span>
                <strong>{match.prize}</strong>
              </div>
              <div className="info-row">
                <span>📍 Venue</span>
                <strong>{match.venue}</strong>
              </div>
            </>
          )}

          {active === "contests" && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="small-label">CONTESTS</span>
                  <h3>Join a Contest</h3>
                </div>
                <span className="panel-icon">🏆</span>
              </div>

              <div className="contest-item">
                <div>
                  <b>Mega Contest</b>
                  <small>₹49 Entry • 50,000+ winners</small>
                </div>
                <button onClick={() => alert("Contest screen ready")}>JOIN</button>
              </div>

              <div className="contest-item">
                <div>
                  <b>Head to Head</b>
                  <small>₹19 Entry • 2 players</small>
                </div>
                <button onClick={() => alert("Contest screen ready")}>JOIN</button>
              </div>
            </>
          )}

          {active === "team" && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="small-label">MY TEAM</span>
                  <h3>Create Your Team</h3>
                </div>
                <span className="panel-icon">👥</span>
              </div>
              <div className="empty-state">
                <div>🏏</div>
                <b>No team created yet</b>
                <p>Select players and create your fantasy team.</p>
                <button className="primary-action" onClick={() => alert("Team builder ready")}>
                  CREATE TEAM
                </button>
              </div>
            </>
          )}

          {active === "score" && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="small-label">LIVE SCORE</span>
                  <h3>{match.short1} vs {match.short2}</h3>
                </div>
                <span className="panel-icon">📊</span>
              </div>
              <div className="score-board">
                <div><span>{match.short1}</span><strong>{match.score1 || "Yet to bat"}</strong></div>
                <div><span>{match.short2}</span><strong>{match.score2 || "Yet to bat"}</strong></div>
              </div>
              <p className="muted">{match.overs || "Match has not started yet."}</p>
            </>
          )}

          {active === "info" && (
            <>
              <div className="panel-heading">
                <div>
                  <span className="small-label">MATCH INFO</span>
                  <h3>Match Information</h3>
                </div>
                <span className="panel-icon">ℹ️</span>
              </div>
              <div className="info-row"><span>🏟 Venue</span><strong>{match.venue}</strong></div>
              <div className="info-row"><span>⏰ Time</span><strong>{match.time}</strong></div>
              <div className="info-row"><span>🏆 Prize Pool</span><strong>{match.prize}</strong></div>
            </>
          )}
        </section>

        <button className="home-back" onClick={onBack}>← BACK TO HOME</button>
      </main>
    </div>
  );
}

function MatchList({ onOpen, onBack }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="back-button" onClick={onBack}>←</button>
        <div>
          <div className="brand-small">BATZO</div>
          <div className="topbar-title">All Matches</div>
        </div>
        <div className="green-dot" />
      </header>

      <main className="page">
        <div className="section-title">
          <div>
            <span className="small-label">CRICKET</span>
            <h1>Live & Upcoming</h1>
          </div>
          <span className="count-badge">{matches.length}</span>
        </div>

        <div className="matches-list">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} onOpen={onOpen} />
          ))}
        </div>
      </main>
    </div>
  );
}

function Home({ onOpenMatch, onOpenMatches }) {
  const [nav, setNav] = useState("home");

  return (
    <div className="app-shell">
      <header className="home-header">
        <div>
          <div className="brand">BATZO</div>
          <div className="tagline">CRICKET HUB</div>
        </div>
        <button className="profile-button" onClick={() => setNav("profile")}>◉</button>
      </header>

      <main className="page home-page">
        {nav === "profile" ? (
          <section className="profile-panel">
            <span className="small-label">ACCOUNT</span>
            <h1>My Profile</h1>
            <p>Manage your Batzo account, teams and contests.</p>
            <button className="primary-action" onClick={() => setNav("home")}>
              ← BACK HOME
            </button>
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-kicker">🏏 BATZO CRICKET</div>
              <h1>Play. Predict.<br /><span>Win Big.</span></h1>
              <p>Fantasy cricket built for every match.</p>
              <button className="hero-button" onClick={onOpenMatches}>
                EXPLORE MATCHES →
              </button>
            </section>

            <div className="section-title">
              <div>
                <span className="small-label">CRICKET</span>
                <h2>Live & Upcoming</h2>
              </div>
              <button className="view-all" onClick={onOpenMatches}>View All →</button>
            </div>

            <div className="matches-list">
              {matches.slice(0, 2).map((match) => (
                <MatchCard key={match.id} match={match} onOpen={onOpenMatch} />
              ))}
            </div>

            <section className="quick-grid">
              <button onClick={onOpenMatches}><span>🏆</span><b>CONTESTS</b><small>Win prizes</small></button>
              <button onClick={onOpenMatches}><span>👥</span><b>MY TEAMS</b><small>Manage teams</small></button>
              <button onClick={onOpenMatches}><span>📊</span><b>SCORES</b><small>Live updates</small></button>
            </section>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={nav === "home" ? "active" : ""} onClick={() => setNav("home")}>
          <span>⌂</span><small>HOME</small>
        </button>
        <button onClick={onOpenMatches}>
          <span>🏏</span><small>MATCHES</small>
        </button>
        <button onClick={onOpenMatches}>
          <span>🏆</span><small>CONTESTS</small>
        </button>
        <button className={nav === "profile" ? "active" : ""} onClick={() => setNav("profile")}>
          <span>◉</span><small>PROFILE</small>
        </button>
      </nav>
    </div>
  );
}

export default 
/* ============================================================
   BATZO PREMIUM CONTEST SYSTEM
   Existing Home / Match flow remains preserved.
   ============================================================ */

function BatzoPremiumContest({ match, onBack }) {
  const [joined, setJoined] = React.useState(false);
  const [selectedContest, setSelectedContest] = React.useState(null);

  const contests = [
    {
      id: 1,
      title: "Mega Contest",
      prize: "₹1 Crore",
      spots: "5,00,000",
      filled: "4,82,340",
      entry: "₹49",
      winners: "75,000",
      tag: "MEGA"
    },
    {
      id: 2,
      title: "Head-to-Head",
      prize: "₹1,800",
      spots: "2",
      filled: "1",
      entry: "₹49",
      winners: "1",
      tag: "H2H"
    },
    {
      id: 3,
      title: "Small League",
      prize: "₹10 Lakh",
      spots: "50,000",
      filled: "31,240",
      entry: "₹99",
      winners: "7,500",
      tag: "POPULAR"
    },
    {
      id: 4,
      title: "Winner Takes More",
      prize: "₹25 Lakh",
      spots: "1,00,000",
      filled: "72,880",
      entry: "₹199",
      winners: "12,000",
      tag: "HOT"
    }
  ];

  if (joined) {
    return (
      <div className="batzo-contest-page">
        <div className="batzo-contest-header">
          <button className="batzo-contest-back" onClick={() => setJoined(false)}>
            ←
          </button>
          <div>
            <div className="batzo-mini-brand">BATZO</div>
            <h1>My Contest</h1>
          </div>
        </div>

        <section className="batzo-joined-card">
          <div className="batzo-success-icon">✓</div>
          <div className="batzo-success-label">CONTEST JOINED</div>
          <h2>{selectedContest?.title || "Mega Contest"}</h2>
          <p>
            {match?.team1 || "India"} vs {match?.team2 || "Australia"}
          </p>

          <div className="batzo-team-box">
            <span>YOUR TEAM</span>
            <strong>Team 1</strong>
            <small>11 Players • Ready</small>
          </div>

          <button
            className="batzo-primary-btn"
            onClick={() => setJoined(false)}
          >
            VIEW MORE CONTESTS
          </button>

          <button
            className="batzo-secondary-btn"
            onClick={onBack}
          >
            ← BACK TO MATCH
          </button>
        </section>
      </div>
    );
  }

  if (selectedContest) {
    const c = selectedContest;

    return (
      <div className="batzo-contest-page">
        <div className="batzo-contest-header">
          <button
            className="batzo-contest-back"
            onClick={() => setSelectedContest(null)}
          >
            ←
          </button>
          <div>
            <div className="batzo-mini-brand">BATZO</div>
            <h1>Contest Details</h1>
          </div>
        </div>

        <section className="batzo-prize-hero">
          <span>{c.tag}</span>
          <small>WIN UP TO</small>
          <strong>{c.prize}</strong>
          <p>{c.title}</p>
        </section>

        <section className="batzo-info-grid">
          <div>
            <small>ENTRY</small>
            <strong>{c.entry}</strong>
          </div>
          <div>
            <small>SPOTS</small>
            <strong>{c.spots}</strong>
          </div>
          <div>
            <small>WINNERS</small>
            <strong>{c.winners}</strong>
          </div>
        </section>

        <section className="batzo-detail-card">
          <div className="batzo-detail-row">
            <span>Prize Pool</span>
            <strong>{c.prize}</strong>
          </div>
          <div className="batzo-detail-row">
            <span>Entry Fee</span>
            <strong>{c.entry}</strong>
          </div>
          <div className="batzo-detail-row">
            <span>Total Spots</span>
            <strong>{c.spots}</strong>
          </div>
          <div className="batzo-detail-row">
            <span>Winners</span>
            <strong>{c.winners}</strong>
          </div>
        </section>

        <div className="batzo-contest-note">
          <span>✓</span>
          <p>Flexible contest UI ready for future real backend integration.</p>
        </div>

        <button
          className="batzo-join-btn"
          onClick={() => setJoined(true)}
        >
          JOIN CONTEST • {c.entry}
        </button>
      </div>
    );
  }

  return (
    <div className="batzo-contest-page">
      <div className="batzo-contest-header">
        <button className="batzo-contest-back" onClick={onBack}>
          ←
        </button>
        <div>
          <div className="batzo-mini-brand">BATZO</div>
          <h1>Contests</h1>
          <p>
            {match?.team1 || "India"} vs {match?.team2 || "Australia"}
          </p>
        </div>
      </div>

      <section className="batzo-contest-tabs">
        <button className="active">ALL</button>
        <button>MEGA</button>
        <button>SMALL</button>
        <button>H2H</button>
      </section>

      <div className="batzo-contest-list">
        {contests.map((c) => {
          const total = Number(c.spots.replace(/,/g, ""));
          const filled = Number(c.filled.replace(/,/g, ""));
          const percent = Math.min(100, Math.round((filled / total) * 100));

          return (
            <article
              className="batzo-contest-card"
              key={c.id}
              onClick={() => setSelectedContest(c)}
            >
              <div className="batzo-contest-card-top">
                <div>
                  <span className="batzo-contest-tag">{c.tag}</span>
                  <h3>{c.title}</h3>
                </div>
                <div className="batzo-prize">
                  <small>PRIZE POOL</small>
                  <strong>{c.prize}</strong>
                </div>
              </div>

              <div className="batzo-progress">
                <span style={{ width: percent + "%" }} />
              </div>

              <div className="batzo-contest-stats">
                <div>
                  <small>SPOTS</small>
                  <strong>{c.filled} / {c.spots}</strong>
                </div>
                <div>
                  <small>WINNERS</small>
                  <strong>{c.winners}</strong>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContest(c);
                  }}
                >
                  {c.entry}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="batzo-safe-footer">
        <span>🏆</span>
        <div>
          <strong>Build your winning team</strong>
          <small>Choose a contest and continue to My Team.</small>
        </div>
      </section>
    </div>
  );
}


function App() {
  const [batzoContestMatch, setBatzoContestMatch] = React.useState(null);

  const [screen, setScreen] = useState("home");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const openMatch = (match) => {
    setSelectedMatch(match);
    setScreen("details");
  };

  if (screen === "details" && selectedMatch) {
  
  React.useEffect(() => {
    const handleBatzoContestClick = (event) => {
      const target = event.target;
      if (!target) return;

      const button = target.closest("button");
      if (!button) return;

      const text = (button.textContent || "").trim().toUpperCase();

      if (
        text.includes("JOIN CONTEST") ||
        text === "CONTESTS" ||
        text.includes("VIEW CONTEST")
      ) {
        event.preventDefault();
        event.stopPropagation();

        const fallbackMatch = {
          team1: "INDIA",
          team2: "AUSTRALIA",
          status: "LIVE",
          time: "3:30 PM"
        };

        setBatzoContestMatch(fallbackMatch);
      }
    };

    (()=>{})("click", handleBatzoContestClick, true);

  
  if (batzoContestMatch) {
    return (
      <BatzoPremiumContest
        match={batzoContestMatch}
        onBack={() => setBatzoContestMatch(null)}
      />
    );
  }

  return () => {
      document.removeEventListener("click", handleBatzoContestClick, true);
    };
  }, []);

  return (
      <MatchDetails
        match={selectedMatch}
        onBack={() => {
          setSelectedMatch(null);
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "matches") {
    return (
      <MatchList
        onOpen={openMatch}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <Home
      onOpenMatch={openMatch}
      onOpenMatches={() => setScreen("matches")}
    />
  );
}
