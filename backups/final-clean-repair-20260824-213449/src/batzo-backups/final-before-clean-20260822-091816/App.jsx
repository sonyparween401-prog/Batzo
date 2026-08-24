import React from "react";
import "./App.css";

const matches = [
  {
    status: "LIVE",
    league: "BATZO PREMIER LEAGUE",
    team1: "Mumbai Tigers",
    team2: "Delhi Kings",
    short1: "MT",
    short2: "DK",
    score1: "148/4",
    score2: "132/7",
    overs: "18.2 / 20",
  },
  {
    status: "UPCOMING",
    league: "BATZO CRICKET",
    team1: "Chennai Lions",
    team2: "Kolkata Riders",
    short1: "CL",
    short2: "KR",
    score1: "",
    score2: "",
    overs: "Today • 7:30 PM",
  },
  {
    status: "UPCOMING",
    league: "BATZO CRICKET",
    team1: "Bangalore Stars",
    team2: "Hyderabad Warriors",
    short1: "BS",
    short2: "HW",
    score1: "",
    score2: "",
    overs: "Tomorrow • 3:30 PM",
  },
];


/* =========================================================
   BATZO_SAFE_MATCH_DETAILS_COMPONENT
   ========================================================= */
function BatzoSafeMatchDetails({ match, onBack }) {
  const [tab, setTab] = React.useState("contests");

  const team1 = match?.team1 || match?.teamA || match?.homeTeam || "TEAM A";
  const team2 = match?.team2 || match?.teamB || match?.awayTeam || "TEAM B";
  const status = match?.status || "UPCOMING";
  const time = match?.time || match?.matchTime || "Match Time";
  const venue = match?.venue || "Cricket Stadium";

  if (batzoSelectedMatch) {
    return (
      <BatzoSafeMatchDetails
        match={batzoSelectedMatch}
        onBack={() => setBatzoSelectedMatch(null)}
      />
    );
  }

  return (
    <div className="batzo-details-page">
      <header className="batzo-details-header">
        <button className="batzo-back-btn" onClick={onBack}>←</button>
        <div>
          <span>BATZO CRICKET</span>
          <h1>Match Details</h1>
        </div>
      </header>

      <section className="batzo-score-card">
        <div className="batzo-status">{status}</div>
        <div className="batzo-teams">
          <div>
            <strong>{team1}</strong>
            <small>Team 1</small>
          </div>
          <div className="batzo-vs">VS</div>
          <div>
            <strong>{team2}</strong>
            <small>Team 2</small>
          </div>
        </div>
        <div className="batzo-match-time">{time}</div>
        <div className="batzo-venue">{venue}</div>
      </section>

      <div className="batzo-details-tabs">
        <button
          className={tab === "contests" ? "active" : ""}
          onClick={() => setTab("contests")}
        >
          🏆<small>Contests</small>
        </button>

        <button
          className={tab === "team" ? "active" : ""}
          onClick={() => setTab("team")}
        >
          👥<small>My Team</small>
        </button>

        <button
          className={tab === "info" ? "active" : ""}
          onClick={() => setTab("info")}
        >
          ℹ️<small>Match Info</small>
        </button>
      </div>

      {tab === "contests" && (
        <section className="batzo-detail-content">
          <div className="batzo-contest-card">
            <div>
              <b>Grand Contest</b>
              <span>₹10 Entry • ₹1 Lakh Prize</span>
            </div>
            <button>JOIN</button>
          </div>

          <div className="batzo-contest-card">
            <div>
              <b>Head to Head</b>
              <span>₹49 Entry • Winner Takes All</span>
            </div>
            <button>JOIN</button>
          </div>

          <div className="batzo-contest-card">
            <div>
              <b>Practice Contest</b>
              <span>Free Entry • Practice Your Team</span>
            </div>
            <button>VIEW</button>
          </div>
        </section>
      )}

      {tab === "team" && (
        <section className="batzo-detail-content">
          <div className="batzo-empty-team">
            <div>🏏</div>
            <h2>Create Your Team</h2>
            <p>Select players after entering a contest.</p>
            <button>Create Team</button>
          </div>
        </section>
      )}

      {tab === "info" && (
        <section className="batzo-detail-content">
          <div className="batzo-info-card">
            <p><b>Status:</b> {status}</p>
            <p><b>Venue:</b> {venue}</p>
            <p><b>Time:</b> {time}</p>
            <p><b>Format:</b> T20 Cricket</p>
          </div>
        </section>
      )}
    </div>
  );
}
/* =========================================================
   END BATZO_SAFE_MATCH_DETAILS_COMPONENT
   ========================================================= */

function App() {
  const [batzoSafeFlow, setBatzoSafeFlow] = useState(null);
  
  /* BATZO_SAFE_GLOBAL_TAP */
  useEffect(() => {
    const batzoTap = (event) => {
      const target = event.target;
      const el = target && target.closest
        ? target.closest("button, article, [role='button'], .match-card, .quick-card, .game-card, .view-all")
        : null;

      if (!el) return;

      const text = (el.innerText || el.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (
        text.includes("view matches") ||
        text === "view all →" ||
        text === "view all"
      ) {
        event.preventDefault();
        event.stopPropagation();
        setBatzoSafeFlow("matches");
        return;
      }

      if (
        text === "cricket" ||
        text.startsWith("cricket ") ||
        text.includes("play matches")
      ) {
        event.preventDefault();
        event.stopPropagation();
        setBatzoSafeFlow("matches");
        return;
      }

      if (el.classList.contains("match-card")) {
        event.preventDefault();
        event.stopPropagation();
        setBatzoSafeFlow("details");
      }
    };

    document.addEventListener("click", batzoTap, true);

    return () => {
      document.removeEventListener("click", batzoTap, true);
    };
  }, []);


  const [batzoSelectedMatch, setBatzoSelectedMatch] = React.useState(null);
  return (
    <div className="app-shell">
      {batzoSafeFlow && (
        <BatzoSafeFlow
          screen={batzoSafeFlow}
          onBack={(next) => setBatzoSafeFlow(next || null)}
        />
      )}


      <header className="top-header">
        <div className="brand">
          <img
            className="batzo-logo"
            src="/batzo-logo.svg"
            alt="Batzo Cricket Gaming"
          />
        </div>

        <div className="header-actions">
          <button className="icon-btn">🔔</button>
          <button className="profile-btn">👤</button>
        </div>
      </header>

      <main>

        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">🔥 BATZO CRICKET</span>

            <h1>
              Play Cricket.
              <br />
              <span>Win Big.</span>
            </h1>

            <p>
              Join exciting cricket contests, create your team
              and compete with players across Batzo.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn">
                🏏 PLAY NOW
              </button>

              <button className="secondary-btn">
                VIEW MATCHES
              </button>
            </div>
          </div>

          <div className="hero-cricket">
            <div className="stadium-glow"></div>
            <div className="big-ball">🏏</div>
            <div className="hero-score">
              <span>LIVE</span>
              <strong>148/4</strong>
              <small>18.2 OVERS</small>
            </div>
          </div>
        </section>

        <section className="quick-section">
          <div className="section-title">
            <div>
              <span className="small-label">QUICK ACCESS</span>
              <h2>Game Center</h2>
            </div>
          </div>

          <div className="quick-grid">

            <div className="quick-card">
              <div className="quick-icon orange">🏏</div>
              <div>
                <strong>Cricket</strong>
                <span>Play matches</span>
              </div>
            </div>

            <div className="quick-card">
              <div className="quick-icon purple">🏆</div>
              <div>
                <strong>Contests</strong>
                <span>Join contests</span>
              </div>
            </div>

            <div className="quick-card">
              <div className="quick-icon green">💰</div>
              <div>
                <strong>Wallet</strong>
                <span>Manage balance</span>
              </div>
            </div>

            <div className="quick-card">
              <div className="quick-icon blue">🎁</div>
              <div>
                <strong>Rewards</strong>
                <span>Get rewards</span>
              </div>
            </div>

          </div>
        </section>

        <section className="matches-section">

          <div className="section-title row-title">
            <div>
              <span className="small-label">CRICKET</span>
              <h2>Live & Upcoming</h2>
            </div>

            <button className="view-all">
              View All →
            </button>
          </div>

          <div className="matches-list">

            {matches.map((match, index) => (
              <article
                className="match-card"
                key={index}
                onClick={() => setBatzoSelectedMatch(match)}
                role="button"
                tabIndex={0}
              >

                <div className="match-top">
                  <span
                    className={
                      match.status === "LIVE"
                        ? "status live"
                        : "status upcoming"
                    }
                  >
                    {match.status === "LIVE" ? "● LIVE" : "UPCOMING"}
                  </span>

                  <span className="league">
                    {match.league}
                  </span>
                </div>

                <div className="teams">

                  <div className="team">
                    <div className="team-logo">{match.short1}</div>
                    <strong>{match.team1}</strong>
                    {match.score1 && (
                      <span className="score">{match.score1}</span>
                    )}
                  </div>

                  <div className="vs">
                    <span>VS</span>
                  </div>

                  <div className="team team-right">
                    <div className="team-logo">{match.short2}</div>
                    <strong>{match.team2}</strong>
                    {match.score2 && (
                      <span className="score">{match.score2}</span>
                    )}
                  </div>

                </div>

                <div className="match-bottom">

                  <span className="match-time">
                    {match.overs}
                  </span>

                  <button className="play-btn">
                    {match.status === "LIVE"
                      ? "JOIN NOW"
                      : "VIEW MATCH"}
                  </button>

                </div>

              </article>
            ))}

          </div>
        </section>

        <section className="banner">

          <div>
            <span className="banner-small">
              BATZO REWARDS
            </span>

            <h2>
              Invite friends.
              <br />
              Earn rewards.
            </h2>

            <p>
              Share Batzo with your friends and
              unlock exciting rewards.
            </p>

            <button className="banner-btn">
              INVITE FRIENDS
            </button>
          </div>

          <div className="banner-art">
            🎁
          </div>

        </section>

        <section className="leaderboard">

          <div className="section-title">
            <span className="small-label">TOP PLAYERS</span>
            <h2>Leaderboard</h2>
          </div>

          <div className="leader-row first">
            <span className="rank">1</span>
            <div className="avatar">👑</div>
            <div className="player">
              <strong>Cricket King</strong>
              <span>Batzo Champion</span>
            </div>
            <strong className="points">9,850</strong>
          </div>

          <div className="leader-row">
            <span className="rank">2</span>
            <div className="avatar">🔥</div>
            <div className="player">
              <strong>Super Striker</strong>
              <span>Top Player</span>
            </div>
            <strong className="points">8,920</strong>
          </div>

          <div className="leader-row">
            <span className="rank">3</span>
            <div className="avatar">⭐</div>
            <div className="player">
              <strong>Batzo Star</strong>
              <span>Rising Player</span>
            </div>
            <strong className="points">8,450</strong>
          </div>

        </section>

      </main>

      <nav className="bottom-nav">

        <button className="nav-item active">
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button className="nav-item">
          <span>🏏</span>
          <small>Matches</small>
        </button>

        <button className="nav-play">
          <span>⚡</span>
        </button>

        <button className="nav-item">
          <span>🏆</span>
          <small>Contests</small>
        </button>

        <button className="nav-item">
          <span>👤</span>
          <small>Profile</small>
        </button>

      </nav>

    </div>
  );
}

export default App;
