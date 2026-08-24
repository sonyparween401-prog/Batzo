
/* BATZO_OFFLINE_CRICKET_START */

const BATZO_LOCAL_CRICKET_RESPONSE = {
  available: true,
  status: "AVAILABLE",
  mode: "OFFLINE-FIRST",
  matches: [
    {
      id: "batzo-live-001",
      status: "LIVE",
      league: "BATZO PREMIER LEAGUE",
      team1: "Mumbai Tigers",
      team2: "Delhi Kings",
      team1Name: "Mumbai Tigers",
      team2Name: "Delhi Kings",
      short1: "MT",
      short2: "DK",
      score1: "148/4",
      score2: "132/7",
      date: "Today",
      time: "6:00 PM",
      venue: "Batzo Cricket Stadium",
      format: "T20"
    },
    {
      id: "batzo-upcoming-001",
      status: "UPCOMING",
      league: "BATZO CRICKET",
      team1: "Chennai Lions",
      team2: "Kolkata Riders",
      team1Name: "Chennai Lions",
      team2Name: "Kolkata Riders",
      short1: "CL",
      short2: "KR",
      score1: "",
      score2: "",
      date: "Today",
      time: "7:30 PM",
      venue: "Batzo Cricket Stadium",
      format: "T20"
    },
    {
      id: "batzo-upcoming-002",
      status: "UPCOMING",
      league: "BATZO CRICKET",
      team1: "Bangalore Stars",
      team2: "Hyderabad Warriors",
      team1Name: "Bangalore Stars",
      team2Name: "Hyderabad Warriors",
      short1: "BS",
      short2: "HW",
      score1: "",
      score2: "",
      date: "Tomorrow",
      time: "3:30 PM",
      venue: "Batzo Cricket Stadium",
      format: "T20"
    }
  ]
};

const BATZO_NATIVE_FETCH =
  typeof window !== "undefined" && window.fetch
    ? window.fetch.bind(window)
    : null;

if (typeof window !== "undefined" && BATZO_NATIVE_FETCH) {
  window.fetch = async function(input, init) {
    let url = "";

    try {
      url = typeof input === "string"
        ? input
        : (input && input.url) || "";
    } catch (_) {}

    const isCricketRequest =
      url.includes("/api/cricket") ||
      url.includes("127.0.0.1:3000") ||
      url.includes("127.0.0.1:3101") ||
      url.includes("localhost:3000") ||
      url.includes("localhost:3101");

    if (isCricketRequest) {
      const body = JSON.stringify(BATZO_LOCAL_CRICKET_RESPONSE);

      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    return BATZO_NATIVE_FETCH(input, init);
  };
}

/* BATZO_OFFLINE_CRICKET_END */

import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
