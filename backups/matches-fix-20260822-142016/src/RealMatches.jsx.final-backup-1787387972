import React, { useEffect, useMemo, useState } from "react";


const getMatchDate = (match) => {
  const value =
    match?.dateTimeGMT ||
    match?.dateTime ||
    match?.date ||
    match?.startTime ||
    match?.start_date ||
    null;

  if (!value) return null;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isMatchLive = (match) => {
  const text = String(
    match?.status ||
    match?.state ||
    match?.matchStatus ||
    ""
  ).toLowerCase();

  return (
    match?.matchStarted === true &&
    match?.matchEnded !== true
  ) || text.includes("live") ||
    text.includes("in progress") ||
    text.includes("stumps") ||
    text.includes("innings break");
};

const isMatchCompleted = (match) => {
  const text = String(
    match?.status ||
    match?.state ||
    match?.matchStatus ||
    ""
  ).toLowerCase();

  return match?.matchEnded === true ||
    text.includes("won by") ||
    text.includes("draw") ||
    text.includes("tied") ||
    text.includes("abandoned") ||
    text.includes("no result");
};

const isMatchUpcoming = (match) => {
  const d = getMatchDate(match);
  if (!d) return false;

  if (isMatchLive(match) || isMatchCompleted(match)) return false;

  return d.getTime() > Date.now();
};

const normalizeMatch = (match) => ({
  ...match,
  teams: Array.isArray(match?.teams) ? match.teams : [],
  teamInfo: Array.isArray(match?.teamInfo) ? match.teamInfo : [],
  dateTimeGMT:
    match?.dateTimeGMT ||
    match?.dateTime ||
    match?.date ||
    null,
  status: match?.status || "Match scheduled"
});

const API =
  import.meta.env.VITE_CRICKET_API_URL ||
  "http://127.0.0.1:3101/api/cricket";

const contestTemplates = [
  { name: "Mega Contest", entry: "₹49", prize: "₹10,000", spots: "500" },
  { name: "Head to Head", entry: "₹25", prize: "₹45", spots: "2" },
  { name: "Small Contest", entry: "₹99", prize: "₹1,500", spots: "20" },
];

function getType(match) {
  if (match?.matchEnded) return "completed";
  if (match?.matchStarted) return "live";
  return "upcoming";
}

function MatchCard({ match, onOpen }) {
  const type = getType(match);
  const teams = Array.isArray(match?.teams) ? match.teams : [];
  const scores = Array.isArray(match?.score) ? match.score : [];

  return (
    <button className="real-match-card" onClick={() => onOpen(match)}>
      <div className="real-match-top">
        <span className={type === "live" ? "real-live" : "real-status"}>
          {type === "live" ? "● LIVE" : type.toUpperCase()}
        </span>
        <span>{match?.matchType || "CRICKET"}</span>
      </div>

      <div className="real-series">
        {match?.name || "Cricket Match"}
      </div>

      <div className="real-teams">
        <div>
          <strong>{teams[0] || "Team A"}</strong>
          {scores[0] && (
            <small>
              {scores[0].r}/{scores[0].w} ({scores[0].o})
            </small>
          )}
        </div>

        <b>VS</b>

        <div>
          <strong>{teams[1] || "Team B"}</strong>
          {scores[1] && (
            <small>
              {scores[1].r}/{scores[1].w} ({scores[1].o})
            </small>
          )}
        </div>
      </div>

      <div className="real-match-status">
        {match?.status || match?.date || "Match details available"}
      </div>

      <div className="real-match-action">
        <span>View Match</span>
        <span>›</span>
      </div>
    </button>
  );
}

function MatchDetails({ match, onBack }) {
  const [tab, setTab] = useState("contests");
  const [scorecard, setScorecard] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const type = getType(match);
  const teams = Array.isArray(match?.teams) ? match.teams : [];

  async function loadScorecard() {
    if (!match?.id) return;

    setLoadingScore(true);

    try {
      const response = await fetch(
        `${API}/scorecard/${encodeURIComponent(match.id)}`
      );

      if (!response.ok) throw new Error("Scorecard unavailable");

      const data = await response.json();
      const incomingMatches =
        Array.isArray(data) ? data :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.matches) ? data.matches :
        Array.isArray(data?.data?.matches) ? data.data.matches :
        [];

      if (incomingMatches.length) {
        setMatches(incomingMatches.map(normalizeMatch));
      }

      setScorecard(data);
    } catch {
      setScorecard({
        error: "Scorecard is temporarily unavailable.",
      });
    } finally {
      setLoadingScore(false);
    }
  }

  useEffect(() => {
    if (tab === "scorecard") loadScorecard();
  }, [tab]);

  return (
    <div className="real-details">
      <button className="real-back" onClick={onBack}>
        ← Back to Matches
      </button>

      <div className="real-details-card">
        <div className="real-details-status">
          {type === "live" ? "● LIVE" : type.toUpperCase()}
        </div>

        <h2>{match?.name || "Match Details"}</h2>

        <div className="real-details-teams">
          <div>{teams[0] || "Team A"}</div>
          <b>VS</b>
          <div>{teams[1] || "Team B"}</div>
        </div>

        <p>{match?.status || "Match information"}</p>
        <p>{match?.venue || "Venue information unavailable"}</p>
      </div>

      <div className="real-tabs">
        <button
          className={tab === "contests" ? "active" : ""}
          onClick={() => setTab("contests")}
        >
          Contests
        </button>

        <button
          className={tab === "scorecard" ? "active" : ""}
          onClick={() => setTab("scorecard")}
        >
          Scorecard
        </button>

        <button
          className={tab === "squad" ? "active" : ""}
          onClick={() => setTab("squad")}
        >
          Squad
        </button>
      </div>

      {tab === "contests" && (
        <div className="contest-list">
          {contestTemplates.map((contest) => (
            <div className="contest-card" key={contest.name}>
              <div>
                <strong>{contest.name}</strong>
                <small>
                  {contest.spots} spots • Prize {contest.prize}
                </small>
              </div>

              <button
                onClick={() =>
                  alert(
                    `Join flow ready for ${contest.name}. Wallet/payment integration will be connected next.`
                  )
                }
              >
                JOIN {contest.entry}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "scorecard" && (
        <div className="real-data-box">
          {loadingScore && <p>Loading live scorecard...</p>}

          {!loadingScore && scorecard && (
            <pre>{JSON.stringify(scorecard, null, 2)}</pre>
          )}

          {!loadingScore && !scorecard && (
            <p>Scorecard will load from the cricket service.</p>
          )}
        </div>
      )}

      {tab === "squad" && (
        <div className="real-data-box">
          <p>
            Squad data is available through the cricket service and will be
            loaded for this match.
          </p>
        </div>
      )}
    </div>
  );
}

export default function RealMatches() {
  const [matches, setMatches] = useState([]);
  
  const normalizedMatches = matches.map(normalizeMatch);

  const liveMatches = normalizedMatches.filter(isMatchLive);

  const completedMatches = normalizedMatches.filter(isMatchCompleted);

  const upcomingMatches = normalizedMatches
    .filter(isMatchUpcoming)
    .sort((a, b) => {
      const da = getMatchDate(a)?.getTime() || 0;
      const db = getMatchDate(b)?.getTime() || 0;
      return da - db;
    });

  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMatches() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/matches`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.matches)
            ? data.matches
            : [];

      setMatches(list);
    } catch (err) {
      setError(
        `Unable to load live matches. Cricket server: ${API} (${err.message})`
      );
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();

    const timer = setInterval(loadMatches, 30000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return matches;
    return matches.filter((m) => getType(m) === tab);
  }, [matches, tab]);

  if (selected) {
    return (
      <MatchDetails
        match={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <section className="real-matches-page">
      <div className="real-page-heading">
        <div>
          <span>CRICKET</span>
          <h1>All Matches</h1>
        </div>

        <button className="real-refresh" onClick={loadMatches}>
          ↻ Refresh
        </button>
      </div>

      <div className="real-match-tabs">
        {[
          ["all", "All"],
          ["live", "Live"],
          ["upcoming", "Upcoming"],
          ["completed", "Completed"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="real-loading">
          <div className="real-spinner" />
          <p>Loading real cricket matches...</p>
        </div>
      )}

      {!loading && error && (
        <div className="real-error">
          <strong>Cricket service unavailable</strong>
          <p>{error}</p>
          <button onClick={loadMatches}>TRY AGAIN</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="real-empty">
          <div>🏏</div>
          <h3>No matches found</h3>
          <p>There are no matches in this category right now.</p>
        </div>
      )}

      <div className="real-match-list">
        {filtered.map((match) => (
          <MatchCard
            key={match.id || `${match.name}-${match.date}`}
            match={match}
            onOpen={setSelected}
          />
        ))}
      </div>
    </section>
  );
}
