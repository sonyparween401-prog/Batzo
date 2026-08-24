import { installBatzoCleanRepair } from "./services/clean-repair";
import { BATZO_PLAYERS, BATZO_CONTESTS, openBatzoTeam, openBatzoContest } from "./batzo-flow.js";
import React, { useMemo, useState } from "react";
import "./App.css";
import { installJoinFlow } from "./services/join-flow-ui";

const liveMatches = [
  {
    id: 1,
    league: "T20",
    a: "India",
    ac: "IND",
    af: "🇮🇳",
    as: "168/4",
    b: "Australia",
    bc: "AUS",
    bf: "🇦🇺",
    bs: "142/7",
    over: "17.2 ov",
    viewers: "2.1L people watching"
  }
];

const upcomingMatches = [
  {
    id: 2,
    league: "T20",
    a: "India",
    ac: "IND",
    af: "🇮🇳",
    b: "Australia",
    bc: "AUS",
    bf: "🇦🇺",
    time: "Today",
    clock: "7:30 PM"
  },
  {
    id: 3,
    league: "T20",
    a: "Pakistan",
    ac: "PAK",
    af: "🇵🇰",
    b: "New Zealand",
    bc: "NZ",
    bf: "🇳🇿",
    time: "Tomorrow",
    clock: "3:30 PM"
  },
  {
    id: 4,
    league: "T20",
    a: "England",
    ac: "ENG",
    af: "🏴",
    b: "South Africa",
    bc: "SA",
    bf: "🇿🇦",
    time: "Tomorrow",
    clock: "7:30 PM"
  }
];

const contests = [
  { title: "Mega Contest", prize: "₹50 Lakhs", entry: "₹49", spots: "2.1L" },
  { title: "Head To Head", prize: "₹1,800", entry: "₹49", spots: "2" },
  { title: "Small Contest", prize: "₹25,000", entry: "₹99", spots: "1,000" }
];

function Logo() {
  return (
    <div className="logo-area">
      <div className="batzo-logo">
        <span>B</span><span>A</span><span>T</span><span>Z</span><span>O</span>
      </div>
      <div className="logo-line">
        <i></i>
        <strong>CRICKET HUB</strong>
        <i></i>
      </div>
    </div>
  );
}

function Header({ setNotice }) {
  return (
    <header className="top-header">
      <Logo />

      <div className="header-right">
        <button
          className="notification-btn"
          onClick={() => setNotice("No new notifications")}
          aria-label="Notifications"
        >
          <span className="bell">♧</span>
          <b>3</b>
        </button>

        <button
          className="wallet-box"
          onClick={() => setNotice("Wallet balance: ₹0")}
        >
          <span className="wallet-icon">▰</span>
          <div>
            <small>Wallet Balance</small>
            <strong>₹0</strong>
          </div>
          <em>›</em>
        </button>
      </div>
    </header>
  );
}

function QuickCard({ icon, title, sub, type, onClick }) {
  return (
    <button className={`quick-card ${type || ""}`} onClick={onClick}>
      <div className="quick-icon">{icon}</div>
      <div className="quick-title">{title}</div>
      <div className="quick-sub">{sub}</div>
      <span className="quick-arrow">›</span>
    </button>
  );
}

function LiveMatchCard({ match, onOpen }) {
  return (
    <button className="live-match-card" onClick={() => onOpen(match)}>
      <div className="live-card-top">
        <span><i className="red-dot"></i> LIVE • {match.league}</span>
        <b>◉ LIVE</b>
      </div>

      <div className="live-score-row">
        <div className="side-team">
          <div className="flag">{match.af}</div>
          <div>
            <strong>{match.ac}</strong>
            <small>{match.a}</small>
          </div>
        </div>

        <div className="score">
          <strong>{match.as}</strong>
          <small>{match.over}</small>
        </div>

        <div className="versus">VS</div>

        <div className="score right-score">
          <strong>{match.bs}</strong>
          <small></small>
        </div>

        <div className="side-team right-team">
          <div>
            <strong>{match.bc}</strong>
            <small>{match.b}</small>
          </div>
          <div className="flag">{match.bf}</div>
        </div>
      </div>

      <div className="live-bottom">
        <div className="watching">
          <span>●</span>
          <b>{match.viewers}</b>
        </div>
        <span className="view-button">VIEW MATCH <b>→</b></span>
      </div>
    </button>
  );
}

function UpcomingCard({ match, onOpen }) {
  return (
    <button className="upcoming-card" onClick={() => onOpen(match)}>
      <div className="up-team">
        <span className="mini-flag">{match.af}</span>
        <div>
          <strong>{match.ac}</strong>
          <small>{match.a}</small>
        </div>
      </div>

      <div className="match-time-box">
        <span>{match.time}</span>
        <strong>{match.clock}</strong>
      </div>

      <div className="up-team away">
        <div>
          <strong>{match.bc}</strong>
          <small>{match.b}</small>
        </div>
        <span className="mini-flag">{match.bf}</span>
      </div>

      <span className="contest-action">VIEW CONTESTS <b>→</b></span>
    </button>
  );
}

function ContestCard({ contest, onClick }) {
  return (
    <button className="contest-card" onClick={onClick}>
      <div>
        <small>WINNING PRIZE</small>
        <strong>{contest.prize}</strong>
      </div>
      <div className="contest-info">
        <b>{contest.title}</b>
        <span>{contest.spots} spots</span>
      </div>
      <div className="join-box">
        <small>JOIN</small>
        <b>{contest.entry}</b>
      </div>
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const openMatch = (match) => {
    setNotice(`${match.a} vs ${match.b} — Match Centre`);
    setTab("matches");
  };

  const upcomingFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return upcomingMatches;

    return upcomingMatches.filter((m) =>
      `${m.a} ${m.b} ${m.ac} ${m.bc} ${m.league}`
        .toLowerCase()
        .includes(q)
    );
  }, [search]);

  const showComing = (name) => {
    setNotice(`${name} section is ready for the next Batzo release.`);
  };

  const goHome = () => {
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="batzo-app">
      <Header setNotice={setNotice} />

      <main className="main-content">
        {notice && (
          <button className="notice-bar" onClick={() => setNotice("")}>
            <span>{notice}</span>
            <b>×</b>
          </button>
        )}

        {tab === "home" && (
          <>
            <section className="hero-banner">
              <div className="hero-copy">
                <span className="hero-kicker">THE NEW CRICKET EXPERIENCE</span>
                <h1>
                  Play smart.<br />
                  <span>Play Batzo.</span>
                </h1>
                <p>
                  Create your best XI, join contests
                  <br />
                  and follow every ball.
                </p>
                <button
                  className="hero-button"
                  onClick={() => setTab("matches")}
                >
                  EXPLORE MATCHES <b>→</b>
                </button>
              </div>

              <div className="hero-cricket">
                <div className="stadium-lights">✦ ✦</div>
                <div className="cricket-ring ring-one"></div>
                <div className="cricket-ring ring-two"></div>
                <div className="cricket-player">🏏</div>
                <div className="cricket-ball">🏏</div>
              </div>

              <div className="hero-dots">
                <i className="active"></i>
                <i></i>
                <i></i>
                <i></i>
              </div>
            </section>

            <section className="quick-grid">
              <QuickCard
                icon="🏏"
                title="Matches"
                sub="Live & upcoming"
                type="green-card"
                onClick={() => setTab("matches")}
              />
              <QuickCard
                icon="🏆"
                title="My Contests"
                sub="Track entries"
                type="gold-card"
                onClick={() => setTab("contests")}
              />
              <QuickCard
                icon="👥"
                title="My Teams"
                sub="Build your XI"
                type="blue-card"
                onClick={() => setTab("teams")}
              />
              <QuickCard
                icon="🎁"
                title="Rewards"
                sub="Coming soon"
                type="pink-card"
                onClick={() => showComing("Rewards")}
              />
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span>PLAY NOW</span>
                  <h2>Live Matches</h2>
                </div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>

              {liveMatches.map((m) => (
                <LiveMatchCard
                  key={m.id}
                  match={m}
                  onOpen={openMatch}
                />
              ))}
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span>DON'T MISS OUT</span>
                  <h2>Upcoming Matches</h2>
                </div>
                <button onClick={() => setTab("matches")}>View all →</button>
              </div>

              <div className="upcoming-list">
                {upcomingMatches.slice(0, 2).map((m) => (
                  <UpcomingCard
                    key={m.id}
                    match={m}
                    onOpen={openMatch}
                  />
                ))}
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div>
                  <span>TOP PICKS</span>
                  <h2>Popular Contests</h2>
                </div>
                <button onClick={() => setTab("contests")}>View all →</button>
              </div>

              <div className="contest-list">
                {contests.map((c) => (
                  <ContestCard
                    key={c.title}
                    contest={c}
                    onClick={() => showComing(c.title)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "matches" && (
          <section className="matches-page">
            <div className="page-heading">
              <span>BATZO CRICKET</span>
              <h1>Matches</h1>
              <p>Choose a match and enter the action.</p>
            </div>

            <div className="search-field">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams or matches"
              />
            </div>

            <div className="match-section-title">LIVE</div>

            {liveMatches.map((m) => (
              <LiveMatchCard
                key={m.id}
                match={m}
                onOpen={openMatch}
              />
            ))}

            <div className="match-section-title upcoming-title">
              UPCOMING
            </div>

            <div className="upcoming-list">
              {upcomingFiltered.map((m) => (
                <UpcomingCard
                  key={m.id}
                  match={m}
                  onOpen={openMatch}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "contests" && (
          <section className="simple-page">
            <div className="page-heading">
              <span>COMPETE</span>
              <h1>Contests</h1>
              <p>Choose your contest and play your way.</p>
            </div>

            <div className="contest-list">
              {contests.map((c) => (
                <ContestCard
                  key={c.title}
                  contest={c}
                  onClick={() => showComing(c.title)}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "teams" && (
          <section className="empty-page">
            <div className="empty-icon">👥</div>
            <span>YOUR SQUADS</span>
            <h1>My Teams</h1>
            <p>Create and manage your fantasy cricket teams here.</p>
            <button
              className="hero-button"
              onClick={() => showComing("Team Builder")}
            >
              CREATE TEAM →
            </button>
          </section>
        )}

        {tab === "profile" && (
          <section className="empty-page">
            <div className="profile-icon">B</div>
            <span>BATZO ACCOUNT</span>
            <h1>Your Profile</h1>
            <p>Profile, wallet and account settings.</p>
            <button
              className="outline-button"
              onClick={() => showComing("Account Settings")}
            >
              ACCOUNT SETTINGS
            </button>
          </section>
        )}
      </main>

      <nav className="bottom-navigation">
        <button
          className={tab === "home" ? "active" : ""}
          onClick={goHome}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          className={tab === "matches" ? "active" : ""}
          onClick={() => setTab("matches")}
        >
          <span>🏏</span>
          <small>Matches</small>
        </button>

        <button
          className={tab === "contests" ? "active" : ""}
          onClick={() => setTab("contests")}
        >
          <span>🏆</span>
          <small>Contests</small>
        </button>

        <button
          className={tab === "teams" ? "active" : ""}
          onClick={() => setTab("teams")}
        >
          <span>👥</span>
          <small>My Teams</small>
        </button>

        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => setTab("profile")}
        >
          <span>◉</span>
          <small>Profile</small>
        </button>
      </nav>
    </div>
  );
}


/* BATZO_FLOW_CONTROLLER */
(function(){
  if(typeof window==="undefined") return;

  function renderTeam(match){
    const root=document.getElementById("root");
    if(!root) return;

    root.innerHTML=`
      <div class="bz-flow-screen">
        <div class="bz-flow-head">
          <div>
            <div style="color:#24e778;font-size:12px;font-weight:900;letter-spacing:2px">BATZO CRICKET</div>
            <h1>Create Team</h1>
            <div style="color:#8f97a5;margin-top:4px">${match} • Select your XI</div>
          </div>
          <button class="bz-flow-back" id="bzBack">← Back</button>
        </div>

        <div id="bzPlayers"></div>

        <div class="bz-flow-bottom">
          <button class="bz-flow-primary" id="bzTeamContinue">CONTINUE • 0/11</button>
        </div>
      </div>
    `;

    const box=document.getElementById("bzPlayers");
    let selected=new Set();

    BATZO_PLAYERS.forEach((p,i)=>{
      const card=document.createElement("div");
      card.className="bz-flow-card";
      card.innerHTML=`
        <div class="bz-flow-player">
          <div class="bz-flow-photo">
            <img src="${p.photo}" alt="${p.name}">
          </div>
          <div class="bz-flow-player-info">
            <div class="bz-flow-player-name">${p.name}</div>
            <div class="bz-flow-player-meta">${p.team} • ${p.role}</div>
            <div class="bz-flow-credit">${p.credit} Credits</div>
          </div>
          <button class="bz-flow-select">ADD</button>
        </div>
      `;

      const btn=card.querySelector("button");
      btn.onclick=()=>{
        if(selected.has(i)){
          selected.delete(i);
          btn.textContent="ADD";
          btn.classList.remove("active");
        }else if(selected.size<11){
          selected.add(i);
          btn.textContent="✓";
          btn.classList.add("active");
        }

        document.getElementById("bzTeamContinue").textContent=
          "CONTINUE • "+selected.size+"/11";
      };

      box.appendChild(card);
    });

    document.getElementById("bzBack").onclick=()=>location.reload();

    document.getElementById("bzTeamContinue").onclick=()=>{
      if(selected.size<11){
        alert("Please select 11 players.");
        return;
      }
      alert("Team selected successfully. Captain & Vice-Captain selection is next.");
    };
  }

  function renderContest(contest){
    const root=document.getElementById("root");
    if(!root) return;

    root.innerHTML=`
      <div class="bz-flow-screen">
        <div class="bz-flow-head">
          <div>
            <div style="color:#24e778;font-size:12px;font-weight:900;letter-spacing:2px">CONTEST</div>
            <h1>${contest.name}</h1>
          </div>
          <button class="bz-flow-back" id="bzContestBack">← Back</button>
        </div>

        <div class="bz-flow-card">
          <div style="color:#858d9a;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">
            Winning Prize
          </div>

          <div class="bz-flow-prize">${contest.prize}</div>

          <div style="margin-top:12px;color:#858d9a">Entry Fee</div>
          <div class="bz-flow-entry">${contest.entry}</div>

          <div class="bz-flow-stats">
            <div class="bz-flow-stat">
              <strong>${contest.spots}</strong>
              <span>SPOTS</span>
            </div>
            <div class="bz-flow-stat">
              <strong>${contest.joined}</strong>
              <span>JOINED</span>
            </div>
            <div class="bz-flow-stat">
              <strong>11</strong>
              <span>PLAYERS</span>
            </div>
          </div>
        </div>

        <div class="bz-flow-card">
          <h3 style="color:#fff">Winning Breakdown</h3>
          <p style="color:#a1a8b4">Rank 1 — 40% Prize Pool</p>
          <p style="color:#a1a8b4">Rank 2 — 20% Prize Pool</p>
          <p style="color:#a1a8b4">Rank 3 — 10% Prize Pool</p>
          <p style="color:#a1a8b4">Other Winners — 30% Prize Pool</p>
        </div>

        <div class="bz-flow-bottom">
          <button class="bz-flow-primary" id="bzJoin">
            JOIN CONTEST • ${contest.entry}
          </button>
        </div>
      </div>
    `;

    document.getElementById("bzContestBack").onclick=()=>location.reload();

    document.getElementById("bzJoin").onclick=()=>{
      renderTeam("IND vs AUS");
    };
  }

  window.addEventListener("batzo:team",e=>{
    renderTeam((e.detail&&e.detail.match)||"IND vs AUS");
  });

  window.addEventListener("batzo:contest",e=>{
    renderContest((e.detail&&e.detail.contest)||BATZO_CONTESTS[0]);
  });

  document.addEventListener("click",e=>{
    const el=e.target.closest("button,a");
    if(!el) return;

    const text=(el.innerText||"").trim().toUpperCase();

    if(
      text.includes("VIEW CONTEST") ||
      text.includes("JOIN CONTEST") ||
      text==="CONTESTS"
    ){
      e.preventDefault();
      e.stopPropagation();
      openBatzoContest(BATZO_CONTESTS[0]);
      return;
    }

    if(
      text.includes("CREATE TEAM") ||
      text.includes("BUILD YOUR XI") ||
      text==="MY TEAMS"
    ){
      e.preventDefault();
      e.stopPropagation();
      openBatzoTeam("IND vs AUS");
      return;
    }
  },true);
})();


/* BATZO FINAL UPCOMING CONTEST REPAIR */
(function(){

  function fireContest(matchName){
    const contests =
      (typeof BATZO_CONTESTS !== "undefined" &&
       Array.isArray(BATZO_CONTESTS))
        ? BATZO_CONTESTS
        : [{
            id:"contest-001",
            name:"Mega Contest",
            prize:"₹1,00,000",
            entry:"₹49",
            spots:10000,
            joined:3210
          }];

    const contest = contests[0];

    window.dispatchEvent(
      new CustomEvent("batzo:contest",{
        detail:{
          contest:contest,
          match:matchName || "IND vs AUS"
        }
      })
    );
  }

  function makeButton(matchName){

    const btn=document.createElement("button");

    btn.type="button";
    btn.className="batzo-final-view-contests";

    btn.textContent="VIEW CONTESTS";

    btn.style.cssText=[
      "display:block",
      "width:100%",
      "margin-top:12px",
      "padding:12px 14px",
      "border:0",
      "border-radius:12px",
      "background:linear-gradient(135deg,#24ef7b,#0fc966)",
      "color:#031009",
      "font-size:13px",
      "font-weight:900",
      "cursor:pointer",
      "box-sizing:border-box"
    ].join(";");

    btn.addEventListener("click",function(e){

      e.preventDefault();
      e.stopPropagation();

      fireContest(matchName || "IND vs AUS");

    },true);

    return btn;
  }

  function textOf(el){
    return (el.innerText || el.textContent || "")
      .replace(/\s+/g," ")
      .trim();
  }

  function repairUpcoming(){

    const all=[...document.querySelectorAll(
      "div,section,article,main"
    )];

    let upcomingFound=false;

    all.forEach(el=>{

      if(!el || el.id==="root") return;

      const txt=textOf(el).toUpperCase();

      if(!txt.includes("UPCOMING")) return;

      if(txt.length>1800) return;

      upcomingFound=true;

      /*
       * Existing match card:
       * find a reasonably small container containing
       * UPCOMING + team information.
       */
      let card=el;

      for(let i=0;i<4 && card.parentElement;i++){

        const parent=card.parentElement;
        const pt=textOf(parent).toUpperCase();

        if(
          pt.includes("UPCOMING") &&
          pt.length < 900
        ){
          card=parent;
        }else{
          break;
        }
      }

      if(
        card.querySelector(
          ".batzo-final-view-contests"
        )
      ) return;

      const matchText=textOf(card);

      let matchName="IND vs AUS";

      if(
        matchText.includes("IND") &&
        matchText.includes("AUS")
      ){
        matchName="IND vs AUS";
      }else if(
        matchText.includes("IND") &&
        matchText.includes("ENG")
      ){
        matchName="IND vs ENG";
      }

      card.appendChild(makeButton(matchName));

    });

    /*
     * If the current Home screen has Upcoming heading
     * but no actual contest CTA/card, create one visible
     * fallback card. This prevents the user getting a blank
     * Upcoming section.
     */
    if(
      upcomingFound &&
      !document.querySelector(
        ".batzo-final-view-contests"
      )
    ){

      const heading=[...document.querySelectorAll(
        "h1,h2,h3,h4,div,span"
      )].find(el =>
        textOf(el).toUpperCase()==="UPCOMING MATCHES"
      );

      if(heading){

        const section=document.createElement("div");

        section.className="batzo-final-generated-match";

        section.style.cssText=[
          "margin:12px 0",
          "padding:15px",
          "border-radius:18px",
          "background:linear-gradient(145deg,#121920,#090d11)",
          "border:1px solid #29313a",
          "color:#fff"
        ].join(";");

        section.innerHTML=`
          <div style="
            color:#ffd43b;
            font-size:10px;
            font-weight:900;
            margin-bottom:10px;
          ">UPCOMING</div>

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            font-weight:900;
            font-size:16px;
          ">
            <span>🇮🇳 INDIA</span>
            <span style="color:#24e778">VS</span>
            <span>🇦🇺 AUSTRALIA</span>
          </div>

          <div style="
            color:#818b97;
            font-size:10px;
            text-align:center;
            margin:9px 0;
          ">
            Upcoming Cricket Match
          </div>
        `;

        section.appendChild(
          makeButton("IND vs AUS")
        );

        heading.parentElement?.appendChild(section);
      }
    }
  }

  /*
   * Existing listener in the project catches
   * VIEW CONTESTS. This final listener is deliberately
   * installed after the existing app logic and directly
   * opens the existing batzo:contest flow.
   */
  window.addEventListener(
    "batzo:open-upcoming-contest",
    function(e){
      fireContest(
        e.detail?.match || "IND vs AUS"
      );
    }
  );

  /*
   * Run after React renders.
   */
  function run(){
    try{
      repairUpcoming();
    }catch(err){
      console.warn(
        "BATZO upcoming repair:",
        err
      );
    }
  }

  if(
    document.readyState==="complete" ||
    document.readyState==="interactive"
  ){
    setTimeout(run,250);
    setTimeout(run,1000);
    setTimeout(run,2500);
  }else{
    document.addEventListener(
      "DOMContentLoaded",
      function(){
        setTimeout(run,250);
        setTimeout(run,1000);
        setTimeout(run,2500);
      }
    );
  }

  /*
   * React/Vite can repaint the Home screen.
   * Keep the CTA attached after repaint.
   */
  let timer=0;

  const observer=new MutationObserver(function(){

    clearTimeout(timer);

    timer=setTimeout(run,120);

  });

  observer.observe(
    document.documentElement,
    {
      childList:true,
      subtree:true
    }
  );

})();



if (typeof window !== "undefined") {
  try {
    installJoinFlow();
  } catch (error) {
    console.warn("Batzo join flow:", error);
  }
}


if (typeof window !== "undefined") {
  try {
    installBatzoCleanRepair();
  } catch (error) {
    console.warn("Batzo clean repair:", error);
  }
}
