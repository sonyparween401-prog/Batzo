import React, { useState } from 'react';
import './App.css';

const matches = [
  {
    id: 1,
    status: 'LIVE',
    league: 'International Cricket',
    team1: 'IND',
    team2: 'AUS',
    team1Name: 'India',
    team2Name: 'Australia',
    score1: '156/4',
    score2: '—',
    overs: '17.2',
    time: 'Live now'
  },
  {
    id: 2,
    status: 'UPCOMING',
    league: 'T20 Match',
    team1: 'ENG',
    team2: 'SA',
    team1Name: 'England',
    team2Name: 'South Africa',
    score1: '—',
    score2: '—',
    overs: '',
    time: 'Today • 7:30 PM'
  },
  {
    id: 3,
    status: 'UPCOMING',
    league: 'Premier Cricket',
    team1: 'WI',
    team2: 'NZ',
    team1Name: 'West Indies',
    team2Name: 'New Zealand',
    score1: '—',
    score2: '—',
    overs: '',
    time: 'Tomorrow • 3:30 PM'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const selectTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="batzo-app">

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand-name">BATZO</div>
            <div className="brand-subtitle">Cricket Hub</div>
          </div>
        </div>

        <button
          className="profile-button"
          onClick={() => selectTab('profile')}
          aria-label="Profile"
        >
          <span>👤</span>
        </button>
      </header>

      <main className="content">

        {activeTab === 'home' && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-badge">🏏 BATZO</span>
                <h1>Cricket starts here.</h1>
                <p>
                  Follow matches, explore contests and manage your cricket
                  experience from one place.
                </p>

                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => selectTab('matches')}
                  >
                    Explore Matches
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => selectTab('contests')}
                  >
                    View Contests
                  </button>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">TODAY</span>
                  <h2>Featured Matches</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => selectTab('matches')}
                >
                  View all
                </button>
              </div>

              <div className="match-list">
                {matches.map((match) => (
                  <article className="match-card" key={match.id}>
                    <div className="match-top">
                      <span className={
                        match.status === 'LIVE'
                          ? 'status live'
                          : 'status upcoming'
                      }>
                        {match.status}
                      </span>
                      <span className="league">{match.league}</span>
                    </div>

                    <div className="teams">
                      <div className="team">
                        <div className="team-logo">{match.team1}</div>
                        <strong>{match.team1Name}</strong>
                        <span>{match.score1}</span>
                      </div>

                      <div className="vs">VS</div>

                      <div className="team">
                        <div className="team-logo">{match.team2}</div>
                        <strong>{match.team2Name}</strong>
                        <span>{match.score2}</span>
                      </div>
                    </div>

                    <div className="match-bottom">
                      <span>
                        {match.status === 'LIVE'
                          ? `Overs ${match.overs}`
                          : match.time}
                      </span>

                      <button
                        className="small-button"
                        onClick={() => selectTab('matches')}
                      >
                        {match.status === 'LIVE' ? 'Follow' : 'View'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="quick-grid">
              <button
                className="quick-card"
                onClick={() => selectTab('matches')}
              >
                <span className="quick-icon">🏏</span>
                <strong>Matches</strong>
                <small>Live & upcoming</small>
              </button>

              <button
                className="quick-card"
                onClick={() => selectTab('contests')}
              >
                <span className="quick-icon">🏆</span>
                <strong>Contests</strong>
                <small>Explore contests</small>
              </button>

              <button
                className="quick-card"
                onClick={() => selectTab('mycontests')}
              >
                <span className="quick-icon">📋</span>
                <strong>My Contests</strong>
                <small>Your activity</small>
              </button>

              <button
                className="quick-card"
                onClick={() => selectTab('profile')}
              >
                <span className="quick-icon">👤</span>
                <strong>Profile</strong>
                <small>Account & settings</small>
              </button>
            </section>
          </>
        )}

        {activeTab === 'matches' && (
          <section className="page-section">
            <span className="eyebrow">BATZO</span>
            <h1>Matches</h1>
            <p className="page-description">
              Follow live and upcoming cricket matches.
            </p>

            <div className="match-list">
              {matches.map((match) => (
                <article className="match-card" key={match.id}>
                  <div className="match-top">
                    <span className={
                      match.status === 'LIVE'
                        ? 'status live'
                        : 'status upcoming'
                    }>
                      {match.status}
                    </span>
                    <span className="league">{match.league}</span>
                  </div>

                  <div className="teams">
                    <div className="team">
                      <div className="team-logo">{match.team1}</div>
                      <strong>{match.team1Name}</strong>
                      <span>{match.score1}</span>
                    </div>

                    <div className="vs">VS</div>

                    <div className="team">
                      <div className="team-logo">{match.team2}</div>
                      <strong>{match.team2Name}</strong>
                      <span>{match.score2}</span>
                    </div>
                  </div>

                  <div className="match-bottom">
                    <span>
                      {match.status === 'LIVE'
                        ? `Overs ${match.overs}`
                        : match.time}
                    </span>
                    <button className="small-button">Details</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'contests' && (
          <section className="page-section">
            <span className="eyebrow">EXPLORE</span>
            <h1>Contests</h1>
            <p className="page-description">
              Explore available cricket contests.
            </p>

            <div className="placeholder-card">
              <div className="placeholder-icon">🏆</div>
              <h2>Contests are coming next</h2>
              <p>
                The contest system will be connected to the Batzo backend
                after the Home experience is complete.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'mycontests' && (
          <section className="page-section">
            <span className="eyebrow">YOUR ACTIVITY</span>
            <h1>My Contests</h1>

            <div className="placeholder-card">
              <div className="placeholder-icon">📋</div>
              <h2>No contests yet</h2>
              <p>
                Your joined contests and results will appear here.
              </p>
              <button
                className="primary-button"
                onClick={() => selectTab('contests')}
              >
                Explore Contests
              </button>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="page-section">
            <span className="eyebrow">ACCOUNT</span>
            <h1>Profile</h1>

            <div className="profile-card">
              <div className="large-avatar">👤</div>
              <div>
                <h2>Welcome to Batzo</h2>
                <p>Login/Register will be added next.</p>
              </div>
            </div>

            <button
              className="primary-button full-button"
              onClick={() => selectTab('home')}
            >
              Back to Home
            </button>
          </section>
        )}

      </main>

      <nav className="bottom-nav">
        <button
          className={activeTab === 'home' ? 'nav-item active' : 'nav-item'}
          onClick={() => selectTab('home')}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          className={activeTab === 'matches' ? 'nav-item active' : 'nav-item'}
          onClick={() => selectTab('matches')}
        >
          <span>🏏</span>
          <small>Matches</small>
        </button>

        <button
          className={activeTab === 'contests' ? 'nav-item active' : 'nav-item'}
          onClick={() => selectTab('contests')}
        >
          <span>🏆</span>
          <small>Contests</small>
        </button>

        <button
          className={activeTab === 'mycontests' ? 'nav-item active' : 'nav-item'}
          onClick={() => selectTab('mycontests')}
        >
          <span>📋</span>
          <small>My Contests</small>
        </button>

        <button
          className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'}
          onClick={() => selectTab('profile')}
        >
          <span>👤</span>
          <small>Profile</small>
        </button>
      </nav>

    </div>
  );
}

export default App;
