import React from "react";

export default function BatzoSafeFlow({ screen, onBack }) {
  if (!screen) return null;

  const matches = [
    {
      title: "BATZO PREMIER LEAGUE",
      team1: "India",
      team2: "Australia",
      status: "LIVE",
      score: "148/4",
      over: "18.2 OVERS"
    },
    {
      title: "BATZO CRICKET",
      team1: "Mumbai",
      team2: "Chennai",
      status: "UPCOMING",
      score: "Starts Soon",
      over: "Today"
    }
  ];

  const details = matches[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        background: "#f4f6fb",
        color: "#111827",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        pointerEvents: "auto"
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "18px 18px",
          background: "#111827",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 14
        }}
      >
        <button
          onClick={onBack}
          style={{
            border: 0,
            borderRadius: 12,
            padding: "10px 14px",
            background: "#21e68a",
            color: "#07130d",
            fontWeight: 900,
            fontSize: 15
          }}
        >
          ← BACK
        </button>

        <strong style={{ fontSize: 18 }}>BATZO</strong>
      </div>

      <div style={{ padding: 18, maxWidth: 700, margin: "0 auto" }}>
        {screen === "matches" && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  color: "#a47712"
                }}
              >
                CRICKET
              </div>
              <h1 style={{ margin: "6px 0", fontSize: 30 }}>
                Live & Upcoming
              </h1>
              <p style={{ color: "#667085" }}>
                Select a match to continue.
              </p>
            </div>

            {matches.map((m, i) => (
              <button
                key={i}
                onClick={() => {
                  window.__batzoSelectedSafeMatch = m;
                  onBack("details");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "1px solid #d9dee8",
                  borderRadius: 22,
                  padding: 20,
                  marginBottom: 14,
                  background: "white",
                  boxShadow: "0 8px 24px rgba(0,0,0,.08)",
                  color: "#111827"
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: m.status === "LIVE" ? "#e84d4d" : "#667085"
                  }}
                >
                  {m.status}
                </div>

                <h2 style={{ margin: "8px 0", fontSize: 20 }}>
                  {m.title}
                </h2>

                <div style={{ fontSize: 17, fontWeight: 800 }}>
                  {m.team1} vs {m.team2}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 14,
                    color: "#667085"
                  }}
                >
                  <span>{m.score}</span>
                  <span>{m.over}</span>
                </div>

                <div
                  style={{
                    marginTop: 15,
                    padding: 12,
                    borderRadius: 12,
                    background: "#111827",
                    color: "white",
                    textAlign: "center",
                    fontWeight: 900
                  }}
                >
                  OPEN MATCH
                </div>
              </button>
            ))}
          </>
        )}

        {screen === "details" && (
          <>
            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: "#111827",
                color: "white",
                boxShadow: "0 14px 35px rgba(0,0,0,.18)"
              }}
            >
              <div
                style={{
                  color: "#21e68a",
                  fontWeight: 900,
                  letterSpacing: 2,
                  fontSize: 12
                }}
              >
                LIVE MATCH
              </div>

              <h1 style={{ margin: "8px 0" }}>
                {details.title}
              </h1>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 20
                }}
              >
                <strong>{details.team1}</strong>
                <span style={{ fontSize: 30, fontWeight: 900 }}>
                  {details.score}
                </span>
                <strong>{details.team2}</strong>
              </div>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  color: "#aab3c2"
                }}
              >
                {details.over}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 18
              }}
            >
              {[
                ["⚡", "Live Score"],
                ["🏆", "Contests"],
                ["👤", "My Team"],
                ["ℹ️", "Match Info"]
              ].map(([icon, label]) => (
                <button
                  key={label}
                  onClick={() => {
                    alert(label + " — Batzo");
                  }}
                  style={{
                    border: 0,
                    borderRadius: 18,
                    padding: 20,
                    background: "white",
                    boxShadow: "0 8px 22px rgba(0,0,0,.08)",
                    fontWeight: 900,
                    fontSize: 16,
                    color: "#111827"
                  }}
                >
                  <div style={{ fontSize: 25 }}>{icon}</div>
                  <div style={{ marginTop: 8 }}>{label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => alert("Join Contest — Batzo")}
              style={{
                width: "100%",
                marginTop: 16,
                border: 0,
                borderRadius: 18,
                padding: 17,
                background: "#21e68a",
                color: "#07130d",
                fontWeight: 900,
                fontSize: 17
              }}
            >
              🏆 JOIN CONTEST
            </button>

            <button
              onClick={onBack}
              style={{
                width: "100%",
                marginTop: 12,
                border: 0,
                borderRadius: 18,
                padding: 16,
                background: "#e8ebf0",
                color: "#111827",
                fontWeight: 900,
                fontSize: 16
              }}
            >
              ← BACK TO MATCHES
            </button>
          </>
        )}
      </div>
    </div>
  );
}
