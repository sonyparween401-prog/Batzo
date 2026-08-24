import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const BATZO_OFFLINE_MATCHES = {
  matches: [
    {
      id: "offline-ipl-1",
      name: "India T20 Match",
      shortName: "IND vs AUS",
      status: "UPCOMING",
      venue: "Cricket Stadium",
      date: new Date(Date.now() + 86400000).toISOString(),
      team1: { name: "India", shortName: "IND" },
      team2: { name: "Australia", shortName: "AUS" }
    },
    {
      id: "offline-ipl-2",
      name: "T20 Cricket Match",
      shortName: "ENG vs SA",
      status: "UPCOMING",
      venue: "International Stadium",
      date: new Date(Date.now() + 172800000).toISOString(),
      team1: { name: "England", shortName: "ENG" },
      team2: { name: "South Africa", shortName: "SA" }
    }
  ]
};

const BATZO_NATIVE_FETCH = window.fetch.bind(window);

window.fetch = async function(input, init = {}) {
  const url =
    typeof input === "string"
      ? input
      : (input && input.url ? input.url : "");

  const isCricketApi =
    url.includes("/api/cricket") ||
    url.includes(":3101") ||
    url.includes("/matches") ||
    url.includes("/cricket");

  if (!isCricketApi) {
    return BATZO_NATIVE_FETCH(input, init);
  }

  try {
    const response = await BATZO_NATIVE_FETCH(input, init);

    if (response && response.ok) {
      return response;
    }
  } catch (_) {
    // Offline fallback below.
  }

  return new Response(
    JSON.stringify(BATZO_OFFLINE_MATCHES),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
