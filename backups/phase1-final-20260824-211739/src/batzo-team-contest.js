/*
 BATZO TEAM + CONTEST UI
 Safe standalone module.
*/

export const BATZO_TEAM_PLAYERS = [
  {name:"Rohit Sharma",role:"Batter",team:"IND",credit:9.5,photo:"/players/rohit-sharma.jpg"},
  {name:"Virat Kohli",role:"Batter",team:"IND",credit:9.5,photo:"/players/virat-kohli.jpg"},
  {name:"Jasprit Bumrah",role:"Bowler",team:"IND",credit:9.0,photo:"/players/jasprit-bumrah.jpg"},
  {name:"Hardik Pandya",role:"All-rounder",team:"IND",credit:9.0,photo:"/players/hardik-pandya.jpg"},
  {name:"KL Rahul",role:"Wicket-keeper",team:"IND",credit:8.5,photo:"/players/rohit-sharma.jpg"},
  {name:"Travis Head",role:"Batter",team:"AUS",credit:9.0,photo:"/players/travis-head.jpg"},
  {name:"Pat Cummins",role:"Bowler",team:"AUS",credit:9.0,photo:"/players/pat-cummins.jpg"}
];

export const BATZO_CONTESTS = [
  {name:"Mega Contest",prize:"₹50 Lakhs",entry:"₹49",spots:"2.1L",joined:"1.84L",winners:"18,500"},
  {name:"Head To Head",prize:"₹1,800",entry:"₹49",spots:"2",joined:"1",winners:"1"},
  {name:"Small Contest",prize:"₹25,000",entry:"₹99",spots:"1,000",joined:"642",winners:"100"}
];

export function batzoTeamSelectionHTML() {
  return `
    <section class="bz-team-builder">
      <div class="bz-team-header">
        <div>
          <h1 class="bz-team-title">Create Team</h1>
          <div class="bz-team-subtitle">Select players for your fantasy XI</div>
        </div>
        <div class="bz-team-progress"><b id="bzSelectedCount">0</b>/11</div>
      </div>

      <div class="bz-role-tabs">
        <div class="bz-role-tab active">WK</div>
        <div class="bz-role-tab">BAT</div>
        <div class="bz-role-tab">AR</div>
        <div class="bz-role-tab">BOWL</div>
      </div>

      <div id="bzTeamPlayers"></div>

      <div class="bz-team-bottom">
        <div class="bz-team-bottom-inner">
          <div class="bz-team-count">
            Players selected<br><strong id="bzBottomCount">0/11</strong>
          </div>
          <button class="bz-primary-btn" id="bzContinueTeam">CONTINUE →</button>
        </div>
      </div>
    </section>
  `;
}

export function batzoContestDetailsHTML(contest = BATZO_CONTESTS[0]) {
  return `
    <section class="bz-contest-details">
      <div class="bz-contest-hero">
        <div class="bz-contest-top">
          <div>
            <div class="bz-contest-prize-label">Winning Prize</div>
            <div class="bz-contest-prize">${contest.prize}</div>
          </div>
          <div class="bz-entry">
            <small>Entry</small>
            <strong>${contest.entry}</strong>
          </div>
        </div>

        <div class="bz-contest-name">${contest.name}</div>

        <div class="bz-contest-stats">
          <div class="bz-contest-stat">
            <strong>${contest.spots}</strong>
            <span>Total Spots</span>
          </div>
          <div class="bz-contest-stat">
            <strong>${contest.joined}</strong>
            <span>Joined</span>
          </div>
          <div class="bz-contest-stat">
            <strong>${contest.winners}</strong>
            <span>Winners</span>
          </div>
        </div>
      </div>

      <div class="bz-section-title">Winning Breakdown</div>

      <div class="bz-contest-hero">
        <div class="bz-winning-row"><span>Rank 1</span><strong>40% Prize Pool</strong></div>
        <div class="bz-winning-row"><span>Rank 2</span><strong>20% Prize Pool</strong></div>
        <div class="bz-winning-row"><span>Rank 3</span><strong>10% Prize Pool</strong></div>
        <div class="bz-winning-row"><span>Other Winners</span><strong>30% Prize Pool</strong></div>
      </div>

      <div class="bz-section-title">Contest Rules</div>

      <div class="bz-contest-hero">
        <div class="bz-winning-row"><span>Team Size</span><strong>11 Players</strong></div>
        <div class="bz-winning-row"><span>Captain</span><strong>2× Points</strong></div>
        <div class="bz-winning-row"><span>Vice Captain</span><strong>1.5× Points</strong></div>
      </div>

      <div class="bz-contest-join">
        <button id="bzJoinContest">JOIN CONTEST • ${contest.entry}</button>
      </div>
    </section>
  `;
}


/* BATZO_MASTER_JOIN_BRIDGE */
(function(){
  document.addEventListener("click",function(e){
    const el=e.target && e.target.closest ? e.target.closest("button") : null;
    if(!el) return;
    const t=(el.innerText||"").trim().toUpperCase();

    if(t.includes("JOIN CONTEST")){
      e.preventDefault();
      e.stopImmediatePropagation();

      if(typeof window.openBatzoTeam==="function"){
        window.openBatzoTeam("IND vs AUS");
      }else{
        window.dispatchEvent(new CustomEvent("batzo:team",{
          detail:{match:"IND vs AUS"}
        }));
      }
    }
  },true);
})();


/* BATZO_FINAL_JOIN_TEAM_BRIDGE */
(function(){
  "use strict";

  if(window.__BATZO_FINAL_JOIN_BRIDGE__) return;
  window.__BATZO_FINAL_JOIN_BRIDGE__=true;

  window.addEventListener("batzo:join-contest",function(){
    if(typeof window.openBatzoTeam==="function"){
      window.openBatzoTeam("IND vs AUS");
    }else{
      window.dispatchEvent(new CustomEvent("batzo:team",{
        detail:{match:"IND vs AUS"}
      }));
    }
  });
})();
