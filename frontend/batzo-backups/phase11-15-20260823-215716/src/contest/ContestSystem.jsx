import React, { useMemo, useState } from "react";
import { batzoContestTypes, batzoPrizeBreakup } from "./contestData";
import "./ContestSystem.css";

export default function ContestSystem({ match, onBack }) {
  const [screen, setScreen] = useState("list");
  const [selected, setSelected] = useState(null);
  const [joined, setJoined] = useState([]);
  const [tab, setTab] = useState("ALL");

  const contests = useMemo(() => {
    if (tab === "ALL") return batzoContestTypes;
    return batzoContestTypes.filter(
      c => c.short === tab
    );
  }, [tab]);

  const openContest = contest => {
    setSelected(contest);
    setScreen("details");
  };

  const joinContest = () => {
    if (!selected) return;
    if (!joined.find(c => c.id === selected.id)) {
      setJoined(prev => [...prev, selected]);
    }
    setScreen("joined");
  };

  if (screen === "details" && selected) {
    const prizes = batzoPrizeBreakup[selected.id] || [];

    return (
      <main className="bz-contest-page">
        <header className="bz-contest-header">
          <button onClick={() => setScreen("list")}>←</button>
          <div>
            <small>BATZO CONTEST</small>
            <h1>{selected.name}</h1>
          </div>
        </header>

        <section className="bz-match-banner">
          <b>{match?.team1 || "INDIA"}</b>
          <span>VS</span>
          <b>{match?.team2 || "AUSTRALIA"}</b>
        </section>

        <section className="bz-contest-hero">
          <span>PRIZE POOL</span>
          <strong>₹{selected.prizePool}</strong>
          <small>Guaranteed Contest</small>
        </section>

        <section className="bz-info-grid">
          <div>
            <small>ENTRY</small>
            <b>₹{selected.entryFee}</b>
          </div>
          <div>
            <small>SPOTS</small>
            <b>{selected.filled}/{selected.spots}</b>
          </div>
          <div>
            <small>WINNERS</small>
            <b>{selected.winners}</b>
          </div>
        </section>

        <section className="bz-panel">
          <h2>Prize Breakup</h2>
          {prizes.map(([rank, amount]) => (
            <div className="bz-prize-row" key={rank}>
              <span>{rank}</span>
              <b>₹{amount}</b>
            </div>
          ))}
        </section>

        <button className="bz-join-btn" onClick={joinContest}>
          JOIN CONTEST · ₹{selected.entryFee}
        </button>
      </main>
    );
  }

  if (screen === "joined") {
    return (
      <main className="bz-contest-page">
        <header className="bz-contest-header">
          <button onClick={() => setScreen("list")}>←</button>
          <div>
            <small>BATZO</small>
            <h1>My Contest</h1>
          </div>
        </header>

        {joined.length === 0 ? (
          <section className="bz-empty">
            <div>🏆</div>
            <h2>No Joined Contest</h2>
            <p>Join a contest to see it here.</p>
            <button onClick={() => setScreen("list")}>
              VIEW CONTESTS
            </button>
          </section>
        ) : (
          <>
            {joined.map(c => (
              <section className="bz-joined-card" key={c.id}>
                <div>
                  <span>{c.name}</span>
                  <strong>₹{c.prizePool}</strong>
                </div>
                <div>
                  <small>Entry ₹{c.entryFee}</small>
                  <small>My Team · 1</small>
                </div>
                <button
                  onClick={() => {
                    setSelected(c);
                    setScreen("leaderboard");
                  }}
                >
                  VIEW LEADERBOARD
                </button>
              </section>
            ))}
          </>
        )}

        <button className="bz-back-home" onClick={onBack}>
          ← BACK TO MATCH
        </button>
      </main>
    );
  }

  if (screen === "leaderboard" && selected) {
    return (
      <main className="bz-contest-page">
        <header className="bz-contest-header">
          <button onClick={() => setScreen("joined")}>←</button>
          <div>
            <small>CONTEST</small>
            <h1>Leaderboard</h1>
          </div>
        </header>

        <section className="bz-leaderboard">
          {[
            ["1", "BATZO PLAYER", "842"],
            ["2", "CRICKET KING", "811"],
            ["3", "SUPER BAT", "786"],
            ["4", "MY TEAM", "742"]
          ].map(([rank, name, points]) => (
            <div
              className={`bz-rank ${name === "MY TEAM" ? "mine" : ""}`}
              key={rank}
            >
              <b>#{rank}</b>
              <span>{name}</span>
              <strong>{points} pts</strong>
            </div>
          ))}
        </section>

        <section className="bz-result-preview">
          <span>RESULT</span>
          <b>Contest is LIVE</b>
          <small>Final winnings will appear after match result.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="bz-contest-page">
      <header className="bz-contest-header">
        <button onClick={onBack}>←</button>
        <div>
          <small>BATZO CRICKET</small>
          <h1>Contests</h1>
        </div>
        <button onClick={() => setScreen("joined")}>🏆</button>
      </header>

      <section className="bz-match-banner">
        <b>{match?.team1 || "INDIA"}</b>
        <span>VS</span>
        <b>{match?.team2 || "AUSTRALIA"}</b>
      </section>

      <div className="bz-tabs">
        {["ALL", "MEGA", "SMALL", "H2H", "STARTER"].map(t => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="bz-contest-list">
        {contests.map(c => {
          const percent = Math.min(
            100,
            Math.round((c.filled / c.spots) * 100)
          );

          return (
            <article
              className="bz-contest-card"
              key={c.id}
              onClick={() => openContest(c)}
            >
              <div className="bz-card-top">
                <span>{c.name}</span>
                <b>₹{c.prizePool}</b>
              </div>

              <div className="bz-card-middle">
                <div>
                  <small>ENTRY</small>
                  <strong>₹{c.entryFee}</strong>
                </div>
                <div>
                  <small>SPOTS</small>
                  <strong>{c.spots}</strong>
                </div>
                <div>
                  <small>WINNERS</small>
                  <strong>{c.winners}</strong>
                </div>
              </div>

              <div className="bz-progress">
                <span style={{ width: `${percent}%` }} />
              </div>

              <div className="bz-card-bottom">
                <small>{c.filled} spots filled</small>
                <b>VIEW CONTEST →</b>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
