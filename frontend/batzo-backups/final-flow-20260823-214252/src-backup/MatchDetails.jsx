import React from "react";

export default function MatchDetails({ match, onBack }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b111b",
      color: "#fff",
      padding: "18px",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif"
    }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          border: 0,
          borderRadius: 12,
          padding: "12px 18px",
          background: "#202b3b",
          color: "#fff",
          fontSize: 16,
          fontWeight: 800
        }}
      >
        ← Back
      </button>

      <div style={{
        marginTop: 24,
        background: "#151e2b",
        borderRadius: 22,
        padding: 22,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 12, color: "#21e68a", fontWeight: 900 }}>
          BATZO MATCH CENTER
        </div>

        <div style={{ fontSize: 42, marginTop: 15 }}>🏏</div>

        <h1 style={{ fontSize: 24, margin: "10px 0" }}>
          {match?.team1 || "Team A"} vs {match?.team2 || "Team B"}
        </h1>

        <div style={{ color: "#aab5c5", marginTop: 10 }}>
          {match?.status || "UPCOMING"}
        </div>

        <div style={{
          marginTop: 22,
          padding: 16,
          background: "#0d1520",
          borderRadius: 15
        }}>
          <div style={{ fontWeight: 800 }}>Contests</div>
          <div style={{ color: "#9aa7b8", marginTop: 5 }}>
            Join contests and create your team
          </div>
        </div>

        <div style={{
          marginTop: 12,
          padding: 16,
          background: "#0d1520",
          borderRadius: 15
        }}>
          <div style={{ fontWeight: 800 }}>My Team</div>
          <div style={{ color: "#9aa7b8", marginTop: 5 }}>
            Build your playing XI
          </div>
        </div>

        <div style={{
          marginTop: 12,
          padding: 16,
          background: "#0d1520",
          borderRadius: 15
        }}>
          <div style={{ fontWeight: 800 }}>Match Info</div>
          <div style={{ color: "#9aa7b8", marginTop: 5 }}>
            Match information will appear here
          </div>
        </div>
      </div>
    </div>
  );
}
