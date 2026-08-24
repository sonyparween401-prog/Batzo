import React, { useState } from "react";
import { BATZO_MATCHES } from "./data/batzo-matches.js";
import { FANTASY_PLAYERS } from "./data/fantasy-players.js";

const photo = p =>
  p?.photo ||
  "data:image/svg+xml," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" rx="22" fill="#111820"/>
        <text x="50" y="62" text-anchor="middle"
          fill="#24e778" font-size="28"
          font-family="Arial" font-weight="800">${p?.short || "PL"}</text>
      </svg>
    `);

function validateTeam(players, captain, vice) {
  if (players.length !== 11) return "Exactly 11 players required.";

  if (captain === vice)
    return "Captain and Vice-Captain must be different.";

  const credits = players.reduce(
    (s, p) => s + Number(p.credits || 0),
    0
  );

  if (credits > 100)
    return "Maximum 100 credits allowed.";

  const ind = players.filter(p => p.team === "IND").length;
  const aus = players.filter(p => p.team === "AUS").length;

  if (ind > 7 || aus > 7)
    return "Maximum 7 players from one team.";

  const wk = players.filter(p => p.role === "WK").length;
  const bat = players.filter(p => p.role === "BAT").length;
  const ar = players.filter(p => p.role === "AR").length;
  const bowl = players.filter(p => p.role === "BOWL").length;

  if (wk < 1 || wk > 4) return "WK combination invalid.";
  if (bat < 3 || bat > 6) return "BAT combination invalid.";
  if (ar < 1 || ar > 4) return "AR combination invalid.";
  if (bowl < 3 || bowl > 6) return "BOWL combination invalid.";

  return null;
}

export function BatzoContestFlow({ matchId, onClose }) {
  const match =
    BATZO_MATCHES.find(m => m.id === matchId) ||
    BATZO_MATCHES[0];

  const [screen, setScreen] = useState("contests");
  const [contest, setContest] = useState(null);
  const [players, setPlayers] = useState([]);
  const [captain, setCaptain] = useState(null);
  const [vice, setVice] = useState(null);
  const [role, setRole] = useState("ALL");
  const [saved, setSaved] = useState(false);

  const visiblePlayers = FANTASY_PLAYERS.filter(
    p => role === "ALL" || p.role === role
  );

  const credits = players.reduce(
    (s, p) => s + Number(p.credits || 0),
    0
  );

  const togglePlayer = player => {
    const exists = players.some(p => p.id === player.id);

    if (exists) {
      setPlayers(players.filter(p => p.id !== player.id));

      if (captain === player.id) setCaptain(null);
      if (vice === player.id) setVice(null);

      return;
    }

    if (players.length >= 11) {
      alert("11 players already selected.");
      return;
    }

    setPlayers([...players, player]);
  };

  const confirmTeam = () => {
    const error = validateTeam(players, captain, vice);

    if (error) {
      alert(error);
      return;
    }

    const savedTeams = JSON.parse(
      localStorage.getItem("batzo_my_teams") || "[]"
    );

    savedTeams.push({
      id: "team-" + Date.now(),
      matchId: match.id,
      contestId: contest?.id,
      players,
      captain,
      vice,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      "batzo_my_teams",
      JSON.stringify(savedTeams)
    );

    setSaved(true);
    setScreen("success");
  };

  return (
    <div className="bz-flow-overlay">
      <div className="bz-flow">

        <div className="bz-flow-head">
          <div>
            <div className="bz-flow-title">
              {screen === "contests" && "Contests"}
              {screen === "players" && "Create Team"}
              {screen === "cv" && "Captain & Vice-Captain"}
              {screen === "success" && "Team Confirmed"}
            </div>

            <div className="bz-flow-sub">
              {match.team1Name} vs {match.team2Name}
            </div>
          </div>

          <button onClick={onClose}>✕</button>
        </div>

        {screen === "contests" && (
          <>
            <div className="bz-match-banner">
              <div>
                <b>🇮🇳 {match.team1Name}</b>
              </div>

              <div className="bz-vs">VS</div>

              <div>
                <b>🇦🇺 {match.team2Name}</b>
              </div>
            </div>

            <div className="bz-section-title">
              Available Contests
            </div>

            {match.contests.map(c => {
              const left = c.spots - c.filled;

              return (
                <div className="bz-contest-card" key={c.id}>
                  <div>
                    <small>Prize Pool</small>
                    <strong>₹{c.prize}</strong>
                  </div>

                  <div>
                    <small>Spots</small>
                    <strong>{left} left</strong>
                  </div>

                  <div>
                    <small>Entry</small>
                    <strong>₹{c.entry}</strong>
                  </div>

                  <button
                    onClick={() => {
                      setContest(c);
                      setScreen("players");
                    }}
                  >
                    JOIN
                  </button>

                  <div className="bz-contest-name">
                    {c.name}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {screen === "players" && (
          <>
            <div className="bz-selection-stats">
              <div>
                <b>{players.length}/11</b>
                <small>Players</small>
              </div>

              <div>
                <b>{credits.toFixed(1)}</b>
                <small>Credits</small>
              </div>

              <div>
                <b>{players.filter(p => p.team === "IND").length}</b>
                <small>IND</small>
              </div>

              <div>
                <b>{players.filter(p => p.team === "AUS").length}</b>
                <small>AUS</small>
              </div>
            </div>

            <div className="bz-role-tabs">
              {["ALL", "WK", "BAT", "AR", "BOWL"].map(r => (
                <button
                  key={r}
                  className={role === r ? "active" : ""}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="bz-player-list">
              {visiblePlayers.map(p => {
                const selected = players.some(
                  x => x.id === p.id
                );

                return (
                  <div
                    className={
                      "bz-player " +
                      (selected ? "selected" : "")
                    }
                    key={p.id}
                  >
                    <img src={photo(p)} />

                    <div className="bz-player-info">
                      <b>{p.name}</b>
                      <span>
                        {p.team} • {p.role}
                      </span>
                      <small>{p.credits} Credits</small>
                    </div>

                    <button
                      onClick={() => togglePlayer(p)}
                    >
                      {selected ? "✓" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              className="bz-main-btn"
              onClick={() => {
                if (players.length !== 11) {
                  alert("Exactly 11 players select karo.");
                  return;
                }

                setScreen("cv");
              }}
            >
              CAPTAIN & VICE-CAPTAIN →
            </button>
          </>
        )}

        {screen === "cv" && (
          <>
            <div className="bz-cv-info">
              <div>
                <b>Captain</b>
                <span>2× Points</span>
              </div>

              <div>
                <b>Vice-Captain</b>
                <span>1.5× Points</span>
              </div>
            </div>

            <div className="bz-player-list">
              {players.map(p => (
                <div className="bz-player" key={p.id}>
                  <img src={photo(p)} />

                  <div className="bz-player-info">
                    <b>{p.name}</b>
                    <span>
                      {p.team} • {p.role}
                    </span>
                  </div>

                  <button
                    className={
                      captain === p.id ? "chosen" : ""
                    }
                    onClick={() => {
                      if (vice === p.id) {
                        alert("C and VC cannot be same.");
                        return;
                      }

                      setCaptain(p.id);
                    }}
                  >
                    {captain === p.id ? "✓C" : "C"}
                  </button>

                  <button
                    className={
                      vice === p.id ? "chosen" : ""
                    }
                    onClick={() => {
                      if (captain === p.id) {
                        alert("C and VC cannot be same.");
                        return;
                      }

                      setVice(p.id);
                    }}
                  >
                    {vice === p.id ? "✓VC" : "VC"}
                  </button>
                </div>
              ))}
            </div>

            <button
              className="bz-main-btn"
              onClick={confirmTeam}
            >
              CONFIRM TEAM
            </button>
          </>
        )}

        {screen === "success" && (
          <div className="bz-success">
            <div className="bz-success-icon">✓</div>

            <h2>Team Successfully Created</h2>

            <p>
              {players.length} Players •
              {" "}C = 2× • VC = 1.5×
            </p>

            <div className="bz-success-card">
              <b>Contest</b>
              <span>{contest?.name}</span>

              <b>Entry</b>
              <span>₹{contest?.entry}</span>

              <b>Prize Pool</b>
              <span>₹{contest?.prize}</span>
            </div>

            <button
              className="bz-main-btn"
              onClick={() => setScreen("contests")}
            >
              VIEW CONTESTS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function UpcomingMatchCards({ onOpen }) {
  return (
    <div className="bz-upcoming-section">
      <div className="bz-section-title">
        Upcoming Matches
      </div>

      {BATZO_MATCHES.map(match => (
        <div className="bz-match-card" key={match.id}>

          <div className="bz-match-status">
            UPCOMING
          </div>

          <div className="bz-match-teams">
            <div>
              <div className="bz-team-logo">🇮🇳</div>
              <b>{match.team1Name}</b>
            </div>

            <div className="bz-match-vs">
              VS
            </div>

            <div>
              <div className="bz-team-logo">🇦🇺</div>
              <b>{match.team2Name}</b>
            </div>
          </div>

          <div className="bz-match-meta">
            {match.date} • {match.venue}
          </div>

          <button
            className="bz-contest-view"
            onClick={() => onOpen(match.id)}
          >
            VIEW CONTESTS
          </button>

        </div>
      ))}
    </div>
  );
}
