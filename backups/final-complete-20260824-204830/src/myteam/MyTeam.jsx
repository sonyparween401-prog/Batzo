import React, { useMemo, useState } from "react";
import {
  batzoPlayers,
  roleRules,
  MAX_PLAYERS,
  MAX_CREDITS
} from "./teamData";
import "./MyTeam.css";

export default function MyTeam({
  match,
  contest,
  onBack,
  onSubmit
}) {
  const [selected, setSelected] = useState([]);
  const [role, setRole] = useState("ALL");
  const [captain, setCaptain] = useState(null);
  const [viceCaptain, setViceCaptain] = useState(null);
  const [preview, setPreview] = useState(false);

  const totalCredits = selected.reduce(
    (sum, id) =>
      sum + (batzoPlayers.find(p => p.id === id)?.credits || 0),
    0
  );

  const selectedPlayers = useMemo(
    () => batzoPlayers.filter(p => selected.includes(p.id)),
    [selected]
  );

  const counts = {
    WK: selectedPlayers.filter(p => p.role === "WK").length,
    BAT: selectedPlayers.filter(p => p.role === "BAT").length,
    AR: selectedPlayers.filter(p => p.role === "AR").length,
    BOWL: selectedPlayers.filter(p => p.role === "BOWL").length
  };

  const togglePlayer = player => {
    const already = selected.includes(player.id);

    if (already) {
      setSelected(prev => prev.filter(id => id !== player.id));
      if (captain === player.id) setCaptain(null);
      if (viceCaptain === player.id) setViceCaptain(null);
      return;
    }

    if (selected.length >= MAX_PLAYERS) return;

    if (totalCredits + player.credits > MAX_CREDITS) return;

    if (counts[player.role] >= roleRules[player.role].max) return;

    setSelected(prev => [...prev, player.id]);
  };

  const validRoles = Object.keys(roleRules).every(r =>
    counts[r] >= roleRules[r].min &&
    counts[r] <= roleRules[r].max
  );

  const validCaptain =
    captain &&
    viceCaptain &&
    captain !== viceCaptain;

  const valid =
    selected.length === MAX_PLAYERS &&
    totalCredits <= MAX_CREDITS &&
    validRoles &&
    validCaptain;

  const submitTeam = () => {
    if (!valid) return;

    const team = {
      id: "team-" + Date.now(),
      match: match || null,
      contest: contest || null,
      players: selectedPlayers,
      captain,
      viceCaptain,
      credits: totalCredits,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("batzoMyTeam", JSON.stringify(team));

    if (onSubmit) onSubmit(team);
  };

  if (preview) {
    return (
      <main className="bz-team-page">
        <header className="bz-team-header">
          <button onClick={() => setPreview(false)}>←</button>
          <div>
            <small>BATZO TEAM PREVIEW</small>
            <h1>My Team</h1>
          </div>
        </header>

        <section className="bz-team-match">
          <b>{match?.team1 || "INDIA"}</b>
          <span>VS</span>
          <b>{match?.team2 || "AUSTRALIA"}</b>
        </section>

        <section className="bz-preview-stats">
          <div>
            <small>PLAYERS</small>
            <b>{selected.length}/11</b>
          </div>
          <div>
            <small>CREDITS</small>
            <b>{totalCredits.toFixed(1)}</b>
          </div>
          <div>
            <small>CONTEST</small>
            <b>₹{contest?.entryFee || 0}</b>
          </div>
        </section>

        <section className="bz-selected-grid">
          {selectedPlayers.map(player => (
            <div className="bz-selected-player" key={player.id}>
              <div className="bz-avatar">
                {player.name.charAt(0)}
              </div>
              <strong>{player.name}</strong>
              <small>{player.role} · {player.credits} Cr</small>

              {captain === player.id && (
                <span className="bz-c-badge">C · 2X</span>
              )}

              {viceCaptain === player.id && (
                <span className="bz-vc-badge">VC · 1.5X</span>
              )}
            </div>
          ))}
        </section>

        <button
          className="bz-submit-team"
          disabled={!valid}
          onClick={submitTeam}
        >
          {valid ? "SUBMIT TEAM" : "COMPLETE TEAM FIRST"}
        </button>
      </main>
    );
  }

  return (
    <main className="bz-team-page">
      <header className="bz-team-header">
        <button onClick={onBack}>←</button>
        <div>
          <small>BATZO FANTASY CRICKET</small>
          <h1>Create Team</h1>
        </div>
      </header>

      <section className="bz-team-match">
        <b>{match?.team1 || "INDIA"}</b>
        <span>VS</span>
        <b>{match?.team2 || "AUSTRALIA"}</b>
      </section>

      <section className="bz-team-counter">
        <div>
          <strong>{selected.length}/11</strong>
          <small>PLAYERS</small>
        </div>
        <div>
          <strong>{totalCredits.toFixed(1)}</strong>
          <small>/ 100 CREDITS</small>
        </div>
        <div>
          <strong>{contest?.name || "TEAM 1"}</strong>
          <small>{contest ? "CONTEST" : "DRAFT"}</small>
        </div>
      </section>

      <div className="bz-role-tabs">
        {["ALL", "WK", "BAT", "AR", "BOWL"].map(r => (
          <button
            key={r}
            className={role === r ? "active" : ""}
            onClick={() => setRole(r)}
          >
            {r}
            {r !== "ALL" && (
              <span>
                {counts[r]}/{roleRules[r].max}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="bz-player-list">
        {batzoPlayers
          .filter(p => role === "ALL" || p.role === role)
          .map(player => {
            const isSelected = selected.includes(player.id);
            const disabled =
              !isSelected &&
              (
                selected.length >= 11 ||
                totalCredits + player.credits > MAX_CREDITS ||
                counts[player.role] >= roleRules[player.role].max
              );

            return (
              <article
                className={`bz-player-card ${
                  isSelected ? "selected" : ""
                }`}
                key={player.id}
                onClick={() => !disabled && togglePlayer(player)}
              >
                <div className="bz-player-avatar">
                  {player.name.charAt(0)}
                </div>

                <div className="bz-player-main">
                  <strong>{player.name}</strong>
                  <small>
                    {player.team} · {player.role} · {player.points} pts
                  </small>
                </div>

                <div className="bz-player-credit">
                  <strong>{player.credits}</strong>
                  <small>Cr</small>
                </div>

                <div className="bz-add">
                  {isSelected ? "✓" : "+"}
                </div>
              </article>
            );
          })}
      </section>

      <section className="bz-captain-box">
        <h2>Captain & Vice-Captain</h2>
        <p>
          Captain gets <b>2X</b> points · Vice-Captain gets <b>1.5X</b>
        </p>

        <div className="bz-cv-grid">
          <label>
            <span>CAPTAIN</span>
            <select
              value={captain || ""}
              onChange={e => setCaptain(e.target.value || null)}
            >
              <option value="">Select Captain</option>
              {selectedPlayers.map(p => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={p.id === viceCaptain}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>VICE-CAPTAIN</span>
            <select
              value={viceCaptain || ""}
              onChange={e => setViceCaptain(e.target.value || null)}
            >
              <option value="">Select VC</option>
              {selectedPlayers.map(p => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={p.id === captain}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="bz-team-actions">
        <button
          className="bz-preview-btn"
          onClick={() => setPreview(true)}
        >
          PREVIEW TEAM
        </button>

        <button
          className="bz-submit-team"
          disabled={!valid}
          onClick={submitTeam}
        >
          {valid ? "SAVE & JOIN CONTEST" : "SELECT 11 PLAYERS"}
        </button>
      </div>
    </main>
  );
}
