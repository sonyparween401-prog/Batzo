(function () {
  if (window.__BATZO_MATCH_FLOW__) return;
  window.__BATZO_MATCH_FLOW__ = true;

  const players = [
    {name:"Rohit Sharma", role:"Batter", team:"IND", runs:"82", stat:"54 balls", photo:"RS"},
    {name:"Virat Kohli", role:"Batter", team:"IND", runs:"64", stat:"42 balls", photo:"VK"},
    {name:"Jasprit Bumrah", role:"Bowler", team:"IND", runs:"3 W", stat:"4.2 overs", photo:"JB"},
    {name:"Hardik Pandya", role:"All-rounder", team:"IND", runs:"31", stat:"2 wickets", photo:"HP"},
    {name:"Travis Head", role:"Batter", team:"AUS", runs:"71", stat:"39 balls", photo:"TH"},
    {name:"Pat Cummins", role:"Bowler", team:"AUS", runs:"2 W", stat:"4 overs", photo:"PC"}
  ];

  const playerPhotos = {
    "Rohit Sharma": "/players/rohit-sharma.jpg",
    "Virat Kohli": "/players/virat-kohli.jpg",
    "Jasprit Bumrah": "/players/jasprit-bumrah.jpg",
    "Hardik Pandya": "/players/hardik-pandya.jpg",
    "Travis Head": "/players/travis-head.jpg",
    "Pat Cummins": "/players/pat-cummins.jpg"
  };

  function avatar(initials, name) {
    const src = playerPhotos[name];
    if (!src) {
      return '<div class="bz-player-avatar">' + initials + '</div>';
    }

    return '<div class="bz-player-avatar bz-real-player-photo">' +
      '<img src="' + src + '" alt="' + name + '" onerror="this.parentElement.classList.add(\'photo-error\');this.style.display=\'none\'">' +
      '</div>';
  }

  function openDetails(type) {
    const live = type === "live";
    const old = document.getElementById("bz-match-details");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.id = "bz-match-details";
    overlay.className = "bz-details-overlay";

    overlay.innerHTML = `
      <div class="bz-details-page">
        <div class="bz-details-top">
          <button class="bz-back">‹</button>
          <div>
            <div class="bz-brand-mini">BATZO CRICKET</div>
            <div class="bz-details-title">Match Details</div>
          </div>
          <div class="bz-status ${live ? "live" : "upcoming"}">
            ${live ? "● LIVE" : "UPCOMING"}
          </div>
        </div>

        <div class="bz-match-hero">
          <div class="bz-format">${live ? "LIVE • T20" : "T20 • INTERNATIONAL"}</div>

          <div class="bz-teams">
            <div class="bz-team">
              <div class="bz-team-flag">🇮🇳</div>
              <strong>IND</strong>
              <span>India</span>
              ${live ? '<b class="bz-big-score">168/4</b><small>17.2 overs</small>' : ''}
            </div>

            <div class="bz-vs">VS</div>

            <div class="bz-team">
              <div class="bz-team-flag">🇦🇺</div>
              <strong>AUS</strong>
              <span>Australia</span>
              ${live ? '<b class="bz-big-score">142/7</b><small>20 overs</small>' : ''}
            </div>
          </div>

          <div class="bz-match-state">
            ${
              live
              ? '<span class="bz-green-dot"></span> India need 0 runs • Match in progress'
              : '<strong>Today • 7:30 PM</strong><span>Match starts soon</span>'
            }
          </div>
        </div>

        <div class="bz-tabs">
          <button class="active" data-tab="score">Scorecard</button>
          <button data-tab="players">Players</button>
          <button data-tab="info">Match Info</button>
        </div>

        <div id="bz-tab-content">
          <div class="bz-score-section">
            <div class="bz-section-label">${live ? "CURRENT SCORE" : "MATCH STATUS"}</div>
            <div class="bz-score-box">
              <div>
                <span>INDIA</span>
                <strong>${live ? "168/4" : "Starts 7:30 PM"}</strong>
              </div>
              <div class="bz-score-divider">VS</div>
              <div>
                <span>AUSTRALIA</span>
                <strong>${live ? "142/7" : "Upcoming"}</strong>
              </div>
            </div>

            <div class="bz-info-grid">
              <div><small>Format</small><b>T20</b></div>
              <div><small>Status</small><b>${live ? "LIVE" : "UPCOMING"}</b></div>
              <div><small>Venue</small><b>International Stadium</b></div>
              <div><small>Series</small><b>Cricket Series</b></div>
            </div>

            ${
              live
              ? '<div class="bz-live-note"><span>●</span> Live score updates are shown here</div>'
              : '<button class="bz-contest-action">VIEW CONTESTS&nbsp; →</button>'
            }
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    overlay.querySelector(".bz-back").onclick = closeDetails;

    overlay.querySelectorAll(".bz-tabs button").forEach(btn => {
      btn.onclick = function () {
        overlay.querySelectorAll(".bz-tabs button").forEach(x => x.classList.remove("active"));
        this.classList.add("active");

        const content = document.getElementById("bz-tab-content");

        if (this.dataset.tab === "players") {
          content.innerHTML = `
            <div class="bz-section-label">PLAYERS</div>
            <div class="bz-player-list">
              ${players.map(p => `
                <div class="bz-player-card">
                  ${avatar(p.photo, p.name)}
                  <div class="bz-player-main">
                    <strong>${p.name}</strong>
                    <span>${p.team} • ${p.role}</span>
                  </div>
                  <div class="bz-player-stat">
                    <strong>${p.runs}</strong>
                    <span>${p.stat}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          `;
        } else if (this.dataset.tab === "info") {
          content.innerHTML = `
            <div class="bz-section-label">MATCH INFORMATION</div>
            <div class="bz-info-card">
              <div><span>Match</span><b>India vs Australia</b></div>
              <div><span>Format</span><b>T20</b></div>
              <div><span>Status</span><b>${live ? "LIVE" : "UPCOMING"}</b></div>
              <div><span>Time</span><b>${live ? "In Progress" : "Today • 7:30 PM"}</b></div>
              <div><span>Venue</span><b>International Stadium</b></div>
            </div>
          `;
        } else {
          content.innerHTML = `
            <div class="bz-score-section">
              <div class="bz-section-label">${live ? "CURRENT SCORE" : "MATCH STATUS"}</div>
              <div class="bz-score-box">
                <div><span>INDIA</span><strong>${live ? "168/4" : "7:30 PM"}</strong></div>
                <div class="bz-score-divider">VS</div>
                <div><span>AUSTRALIA</span><strong>${live ? "142/7" : "UPCOMING"}</strong></div>
              </div>
              <div class="bz-info-grid">
                <div><small>Format</small><b>T20</b></div>
                <div><small>Status</small><b>${live ? "LIVE" : "UPCOMING"}</b></div>
                <div><small>Venue</small><b>International Stadium</b></div>
                <div><small>Series</small><b>Cricket Series</b></div>
              </div>
            </div>
          `;
        }
      };
    });

    const contestBtn = overlay.querySelector(".bz-contest-action");
    if (contestBtn) {
      contestBtn.onclick = function () {
        alert("Contest section ready — next flow can connect here.");
      };
    }
  }

  function closeDetails() {
    const el = document.getElementById("bz-match-details");
    if (el) el.remove();
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    const el = e.target.closest("button,a,[role='button'],div");
    if (!el) return;

    const text = (el.innerText || el.textContent || "").trim().toUpperCase();

    if (text.includes("VIEW MATCH")) {
      e.preventDefault();
      e.stopPropagation();
      openDetails("live");
      return;
    }

    if (text.includes("VIEW CONTESTS")) {
      e.preventDefault();
      e.stopPropagation();
      openDetails("upcoming");
      return;
    }
  }, true);
})();
