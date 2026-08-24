import { FANTASY_PLAYERS, TEAM_RULES } from "./data/fantasy-players.js";

(function () {
  if (window.__BATZO_VISIBLE_FLOW__) return;
  window.__BATZO_VISIBLE_FLOW__ = true;

  const KEY = "batzo_visible_my_teams";

  const getTeams = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  };

  const saveTeams = teams =>
    localStorage.setItem(KEY, JSON.stringify(teams));

  const photo = p =>
    p.photo ||
    "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
          <rect width="120" height="120" rx="24" fill="#101820"/>
          <text x="60" y="72" text-anchor="middle"
                fill="#24e778" font-size="34"
                font-family="Arial" font-weight="800">${p.short}</text>
        </svg>`
      );

  const css = `
  #bz-real-flow{
    position:fixed;
    inset:0;
    z-index:2147483647;
    overflow:auto;
    background:#05070a;
    color:#fff;
    font-family:Arial,sans-serif;
  }

  #bz-real-flow *{box-sizing:border-box}

  .bzrf-wrap{
    max-width:620px;
    margin:auto;
    padding:18px 15px 125px;
  }

  .bzrf-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom:14px;
  }

  .bzrf-title{
    font-size:25px;
    font-weight:900;
    margin:0;
  }

  .bzrf-sub{
    color:#8e97a5;
    font-size:12px;
    margin-top:4px;
  }

  .bzrf-back{
    border:1px solid #303742;
    background:#11161c;
    color:#fff;
    border-radius:11px;
    padding:10px 13px;
    font-weight:800;
  }

  .bzrf-bar{
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:8px;
    margin:12px 0;
  }

  .bzrf-team{
    border:1px solid #292f38;
    background:#0d1217;
    border-radius:13px;
    padding:11px;
    text-align:center;
    font-weight:900;
  }

  .bzrf-team.active{
    border-color:#22e878;
    background:rgba(34,232,120,.08);
    color:#22e878;
  }

  .bzrf-stats{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:6px;
    margin:12px 0;
  }

  .bzrf-stat{
    background:#0d1217;
    border:1px solid #252b33;
    border-radius:11px;
    padding:9px 4px;
    text-align:center;
  }

  .bzrf-stat b{
    display:block;
    font-size:15px;
  }

  .bzrf-stat span{
    display:block;
    color:#7e8794;
    font-size:9px;
    margin-top:3px;
  }

  .bzrf-tabs{
    display:flex;
    gap:6px;
    overflow:auto;
    padding:4px 0 10px;
  }

  .bzrf-tab{
    flex:0 0 auto;
    border:1px solid #292f38;
    background:#0d1217;
    color:#929aa7;
    border-radius:10px;
    padding:9px 12px;
    font-size:11px;
    font-weight:900;
  }

  .bzrf-tab.active{
    color:#07100a;
    background:#22e878;
    border-color:#22e878;
  }

  .bzrf-player{
    display:flex;
    align-items:center;
    gap:11px;
    background:linear-gradient(145deg,#11171d,#090c11);
    border:1px solid #292f38;
    border-radius:16px;
    padding:10px;
    margin:7px 0;
  }

  .bzrf-player.selected{
    border-color:#22e878;
    box-shadow:0 0 0 1px rgba(34,232,120,.15);
  }

  .bzrf-photo{
    width:55px;
    height:55px;
    flex:0 0 55px;
    overflow:hidden;
    border-radius:14px;
    background:#111923;
    border:1px solid #28323a;
  }

  .bzrf-photo img{
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:center top;
  }

  .bzrf-info{
    flex:1;
    min-width:0;
  }

  .bzrf-name{
    font-size:15px;
    font-weight:900;
  }

  .bzrf-meta{
    color:#8b94a1;
    font-size:11px;
    margin-top:4px;
  }

  .bzrf-credit{
    color:#ffd43b;
    font-size:11px;
    font-weight:900;
    margin-top:3px;
  }

  .bzrf-add{
    border:1px solid #303842;
    background:#10161c;
    color:#fff;
    border-radius:10px;
    padding:10px 12px;
    font-weight:900;
  }

  .bzrf-add.on{
    background:#22e878;
    border-color:#22e878;
    color:#041008;
  }

  .bzrf-bottom{
    position:fixed;
    left:0;
    right:0;
    bottom:0;
    z-index:2147483648;
    background:rgba(4,7,10,.98);
    border-top:1px solid #272e37;
    padding:10px 15px calc(10px + env(safe-area-inset-bottom));
  }

  .bzrf-bottom-in{
    max-width:620px;
    margin:auto;
    display:flex;
    gap:10px;
    align-items:center;
  }

  .bzrf-bottom-info{
    flex:1;
    color:#929aa7;
    font-size:11px;
  }

  .bzrf-bottom-info b{
    color:#fff;
    font-size:16px;
  }

  .bzrf-primary{
    border:0;
    background:linear-gradient(135deg,#23ef7b,#10c963);
    color:#031009;
    border-radius:13px;
    padding:14px 17px;
    font-weight:900;
  }

  .bzrf-cvcards{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
    margin:15px 0;
  }

  .bzrf-cv{
    border:1px solid #292f38;
    background:#0d1217;
    border-radius:16px;
    padding:14px;
  }

  .bzrf-cv h3{
    margin:0 0 10px;
    font-size:14px;
  }

  .bzrf-cv p{
    color:#929aa7;
    font-size:11px;
    margin:0;
  }

  .bzrf-cv.active{
    border-color:#22e878;
    background:rgba(34,232,120,.07);
  }

  .bzrf-confirm-player{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 0;
    border-bottom:1px solid #20262e;
  }

  .bzrf-mini{
    width:40px;
    height:40px;
    border-radius:11px;
    overflow:hidden;
  }

  .bzrf-mini img{
    width:100%;
    height:100%;
    object-fit:cover;
  }

  .bzrf-badge{
    margin-left:auto;
    color:#22e878;
    font-size:10px;
    font-weight:900;
  }

  .bzrf-team-card{
    border:1px solid #292f38;
    background:linear-gradient(145deg,#11171d,#090c11);
    border-radius:18px;
    padding:15px;
    margin:10px 0;
  }

  .bzrf-team-card-top{
    display:flex;
    justify-content:space-between;
    align-items:center;
  }

  .bzrf-team-card h3{
    margin:0;
  }

  .bzrf-green{
    color:#22e878;
    font-weight:900;
  }

  .bzrf-danger{
    border:1px solid #542c31;
    background:#171013;
    color:#ff7b82;
    border-radius:9px;
    padding:8px 10px;
    font-weight:800;
  }

  @media(max-width:380px){
    .bzrf-name{font-size:13px}
    .bzrf-photo{width:50px;height:50px;flex-basis:50px}
    .bzrf-primary{padding:13px 12px;font-size:12px}
  }
  `;

  function addStyle(){
    if(document.getElementById("bz-real-flow-style")) return;
    const s=document.createElement("style");
    s.id="bz-real-flow-style";
    s.textContent=css;
    document.head.appendChild(s);
  }

  function closeFlow(){
    document.getElementById("bz-real-flow")?.remove();
    document.getElementById("bz-real-flow-style")?.remove();
  }

  function shell(title,sub,body,bottom=""){
    closeFlow();
    addStyle();

    const root=document.createElement("div");
    root.id="bz-real-flow";

    root.innerHTML=`
      <div class="bzrf-wrap">
        <div class="bzrf-head">
          <div>
            <h1 class="bzrf-title">${title}</h1>
            <div class="bzrf-sub">${sub}</div>
          </div>
          <button class="bzrf-back" id="bzrfBack">← Back</button>
        </div>
        ${body}
      </div>
      ${bottom}
    `;

    document.body.appendChild(root);

    root.querySelector("#bzrfBack").onclick=closeFlow;

    return root;
  }

  function teamSelect(){
    let selected=new Set();

    const body=`
      <div class="bzrf-bar">
        <div class="bzrf-team active">🇮🇳 INDIA</div>
        <div class="bzrf-team">🇦🇺 AUSTRALIA</div>
      </div>

      <div class="bzrf-stats">
        <div class="bzrf-stat"><b id="bzCount">0</b><span>PLAYERS</span></div>
        <div class="bzrf-stat"><b id="bzCredits">0</b><span>CREDITS</span></div>
        <div class="bzrf-stat"><b id="bzInd">0</b><span>IND</span></div>
        <div class="bzrf-stat"><b id="bzAus">0</b><span>AUS</span></div>
      </div>

      <div class="bzrf-tabs">
        <button class="bzrf-tab active" data-role="ALL">ALL</button>
        <button class="bzrf-tab" data-role="WK">WK</button>
        <button class="bzrf-tab" data-role="BAT">BAT</button>
        <button class="bzrf-tab" data-role="AR">AR</button>
        <button class="bzrf-tab" data-role="BOWL">BOWL</button>
      </div>

      <div id="bzPlayers"></div>
    `;

    const bottom=`
      <div class="bzrf-bottom">
        <div class="bzrf-bottom-in">
          <div class="bzrf-bottom-info">
            <b id="bzBottom">0/11</b><br>
            Select exactly 11 players
          </div>
          <button class="bzrf-primary" id="bzNext">CAPTAIN →</button>
        </div>
      </div>
    `;

    const root=shell(
      "Create Team",
      "IND vs AUS • Select 11 players",
      body,
      bottom
    );

    const list=root.querySelector("#bzPlayers");

    function render(role="ALL"){
      list.innerHTML="";

      FANTASY_PLAYERS
        .filter(p=>role==="ALL" || p.role===role)
        .forEach(p=>{
          const el=document.createElement("div");

          el.className="bzrf-player"+
            (selected.has(p.id)?" selected":"");

          el.innerHTML=`
            <div class="bzrf-photo">
              <img src="${photo(p)}" alt="${p.name}">
            </div>
            <div class="bzrf-info">
              <div class="bzrf-name">${p.name}</div>
              <div class="bzrf-meta">
                ${p.team} • ${p.role}
              </div>
              <div class="bzrf-credit">
                ${p.credits} Credits
              </div>
            </div>
            <button class="bzrf-add ${
              selected.has(p.id)?"on":""
            }">
              ${selected.has(p.id)?"✓":"ADD"}
            </button>
          `;

          el.querySelector("button").onclick=()=>{
            if(selected.has(p.id)){
              selected.delete(p.id);
            }else{
              if(selected.size>=11){
                alert("11 players already selected.");
                return;
              }
              selected.add(p.id);
            }

            render(role);
            update();
          };

          list.appendChild(el);
        });
    }

    function update(){
      const players=FANTASY_PLAYERS.filter(p=>selected.has(p.id));
      const credits=players.reduce((s,p)=>s+p.credits,0);
      const ind=players.filter(p=>p.team==="IND").length;
      const aus=players.filter(p=>p.team==="AUS").length;

      root.querySelector("#bzCount").textContent=players.length;
      root.querySelector("#bzCredits").textContent=credits.toFixed(1);
      root.querySelector("#bzInd").textContent=ind;
      root.querySelector("#bzAus").textContent=aus;
      root.querySelector("#bzBottom").textContent=
        `${players.length}/11`;
    }

    root.querySelectorAll(".bzrf-tab").forEach(tab=>{
      tab.onclick=()=>{
        root.querySelectorAll(".bzrf-tab")
          .forEach(x=>x.classList.remove("active"));
        tab.classList.add("active");
        render(tab.dataset.role);
      };
    });

    root.querySelector("#bzNext").onclick=()=>{
      const players=FANTASY_PLAYERS.filter(p=>selected.has(p.id));

      if(players.length!==11){
        alert("Exactly 11 players select karo.");
        return;
      }

      const credits=players.reduce((s,p)=>s+p.credits,0);
      const ind=players.filter(p=>p.team==="IND").length;
      const aus=players.filter(p=>p.team==="AUS").length;

      if(credits>100){
        alert("100 credits se zyada allowed nahi.");
        return;
      }

      if(ind>7 || aus>7){
        alert("Maximum 7 players ek team se.");
        return;
      }

      const roleCount=r=>players.filter(p=>p.role===r).length;

      if(roleCount("WK")<1 || roleCount("WK")>4){
        alert("WK combination invalid.");
        return;
      }

      if(roleCount("BAT")<3 || roleCount("BAT")>6){
        alert("BAT combination invalid.");
        return;
      }

      if(roleCount("AR")<1 || roleCount("AR")>4){
        alert("AR combination invalid.");
        return;
      }

      if(roleCount("BOWL")<3 || roleCount("BOWL")>6){
        alert("BOWL combination invalid.");
        return;
      }

      captainSelect(players);
    };

    render();
    update();
  }

  function captainSelect(players){
    let captain=null;
    let vice=null;

    const body=`
      <div class="bzrf-cvcards">
        <div class="bzrf-cv active">
          <h3>⭐ Captain</h3>
          <p>Captain gets 2× fantasy points</p>
        </div>
        <div class="bzrf-cv">
          <h3>⚡ Vice-Captain</h3>
          <p>Vice-Captain gets 1.5× points</p>
        </div>
      </div>

      <div id="bzCVPlayers"></div>
    `;

    const bottom=`
      <div class="bzrf-bottom">
        <div class="bzrf-bottom-in">
          <div class="bzrf-bottom-info">
            <b id="bzCVStatus">C: Select • VC: Select</b><br>
            C = 2× • VC = 1.5×
          </div>
          <button class="bzrf-primary" id="bzConfirm">
            CONFIRM TEAM
          </button>
        </div>
      </div>
    `;

    const root=shell(
      "Captain & VC",
      "Select one Captain and one Vice-Captain",
      body,
      bottom
    );

    const box=root.querySelector("#bzCVPlayers");

    players.forEach(p=>{
      const row=document.createElement("div");
      row.className="bzrf-player";

      row.innerHTML=`
        <div class="bzrf-photo">
          <img src="${photo(p)}" alt="${p.name}">
        </div>
        <div class="bzrf-info">
          <div class="bzrf-name">${p.name}</div>
          <div class="bzrf-meta">${p.team} • ${p.role}</div>
        </div>
        <button class="bzrf-add">C</button>
        <button class="bzrf-add">VC</button>
      `;

      const [cb,vb]=row.querySelectorAll("button");

      cb.onclick=()=>{
        if(vice===p.id){
          alert("Captain aur Vice-Captain same player nahi ho sakte.");
          return;
        }
        captain=p.id;
        refresh();
      };

      vb.onclick=()=>{
        if(captain===p.id){
          alert("Captain aur Vice-Captain same player nahi ho sakte.");
          return;
        }
        vice=p.id;
        refresh();
      };

      row.dataset.id=p.id;
      box.appendChild(row);
    });

    function refresh(){
      box.querySelectorAll(".bzrf-player").forEach(row=>{
        const id=row.dataset.id;
        const [cb,vb]=row.querySelectorAll("button");

        cb.classList.toggle("on",captain===id);
        vb.classList.toggle("on",vice===id);

        cb.textContent=captain===id?"✓ C":"C";
        vb.textContent=vice===id?"✓ VC":"VC";
      });

      const cn=players.find(p=>p.id===captain)?.name||"Select";
      const vn=players.find(p=>p.id===vice)?.name||"Select";

      root.querySelector("#bzCVStatus").textContent=
        `C: ${cn} • VC: ${vn}`;
    }

    root.querySelector("#bzConfirm").onclick=()=>{
      if(!captain || !vice){
        alert("Captain aur Vice-Captain dono select karo.");
        return;
      }

      const team={
        id:"team-"+Date.now(),
        match:"IND vs AUS",
        players,
        captainId:captain,
        viceCaptainId:vice,
        createdAt:new Date().toISOString()
      };

      const teams=getTeams();
      teams.push(team);
      saveTeams(teams);

      teamConfirmed(team);
    };

    refresh();
  }

  function teamConfirmed(team){
    const captain=team.players.find(p=>p.id===team.captainId);
    const vice=team.players.find(p=>p.id===team.viceCaptainId);

    const body=`
      <div class="bzrf-team-card">
        <div class="bzrf-team-card-top">
          <h3>Team 1</h3>
          <span class="bzrf-green">✓ SAVED</span>
        </div>

        <p class="bzrf-sub">
          ${team.players.filter(p=>p.team==="IND").length}
          IND •
          ${team.players.filter(p=>p.team==="AUS").length}
          AUS •
          ${team.players.reduce((s,p)=>s+p.credits,0).toFixed(1)}
          Credits
        </p>

        <div class="bzrf-confirm-player">
          <div class="bzrf-mini">
            <img src="${photo(captain)}">
          </div>
          <div>
            <b>${captain.name}</b><br>
            <span class="bzrf-sub">Captain • 2×</span>
          </div>
          <span class="bzrf-badge">C</span>
        </div>

        <div class="bzrf-confirm-player">
          <div class="bzrf-mini">
            <img src="${photo(vice)}">
          </div>
          <div>
            <b>${vice.name}</b><br>
            <span class="bzrf-sub">Vice-Captain • 1.5×</span>
          </div>
          <span class="bzrf-badge">VC</span>
        </div>
      </div>

      <h3 style="margin-top:22px">11 Players</h3>

      <div id="bzConfirmedList"></div>
    `;

    const root=shell(
      "Team Confirmed",
      "Your fantasy team is saved",
      body
    );

    const list=root.querySelector("#bzConfirmedList");

    team.players.forEach(p=>{
      const row=document.createElement("div");
      row.className="bzrf-confirm-player";

      row.innerHTML=`
        <div class="bzrf-mini">
          <img src="${photo(p)}">
        </div>
        <div>
          <b>${p.name}</b><br>
          <span class="bzrf-sub">${p.team} • ${p.role} • ${p.credits} Credits</span>
        </div>
        ${
          p.id===team.captainId
            ? `<span class="bzrf-badge">C</span>`
            : p.id===team.viceCaptainId
              ? `<span class="bzrf-badge">VC</span>`
              : ""
        }
      `;

      list.appendChild(row);
    });

    const bottom=document.createElement("div");
    bottom.className="bzrf-bottom";
    bottom.innerHTML=`
      <div class="bzrf-bottom-in">
        <div class="bzrf-bottom-info">
          <b>Team 1</b><br>
          Ready for contest
        </div>
        <button class="bzrf-primary" id="bzMyTeams">
          MY TEAMS
        </button>
      </div>
    `;

    root.appendChild(bottom);

    bottom.querySelector("#bzMyTeams").onclick=myTeams;
  }

  function myTeams(){
    const teams=getTeams();

    const body=`
      ${
        teams.length
        ? teams.map((team,index)=>{
            const c=team.players.find(p=>p.id===team.captainId);
            const v=team.players.find(p=>p.id===team.viceCaptainId);

            return `
              <div class="bzrf-team-card">
                <div class="bzrf-team-card-top">
                  <h3>Team ${index+1}</h3>
                  <span class="bzrf-green">
                    ${team.players.length}/11
                  </span>
                </div>

                <p class="bzrf-sub">
                  IND ${team.players.filter(p=>p.team==="IND").length}
                  •
                  AUS ${team.players.filter(p=>p.team==="AUS").length}
                </p>

                <p>
                  ⭐ <b>${c?.name||"-"}</b>
                  <span class="bzrf-green"> C</span>
                </p>

                <p>
                  ⚡ <b>${v?.name||"-"}</b>
                  <span class="bzrf-green"> VC</span>
                </p>
              </div>
            `;
          }).join("")
        : `
          <div class="bzrf-team-card">
            <h3>No Team Yet</h3>
            <p class="bzrf-sub">
              Create your first 11-player team.
            </p>
          </div>
        `
      }
    `;

    const root=shell(
      "My Teams",
      "Saved fantasy teams",
      body
    );

    const bottom=document.createElement("div");
    bottom.className="bzrf-bottom";
    bottom.innerHTML=`
      <div class="bzrf-bottom-in">
        <div class="bzrf-bottom-info">
          <b>${teams.length} Team${teams.length===1?"":"s"}</b><br>
          Saved on this device
        </div>
        <button class="bzrf-primary" id="bzCreateAgain">
          CREATE TEAM
        </button>
      </div>
    `;

    root.appendChild(bottom);
    bottom.querySelector("#bzCreateAgain").onclick=teamSelect;
  }

  function shouldOpenTeam(text){
    text=text.toUpperCase();

    return (
      text.includes("JOIN CONTEST") ||
      text.includes("CREATE TEAM") ||
      text.includes("BUILD YOUR XI") ||
      text.includes("MY TEAM")
    );
  }

  document.addEventListener("click",function(e){
    const target=e.target.closest("button,a");
    if(!target) return;

    const text=(target.innerText||target.textContent||"").trim();

    if(!shouldOpenTeam(text)) return;

    e.preventDefault();
    e.stopPropagation();

    if(text.toUpperCase().includes("MY TEAM")){
      myTeams();
    }else{
      teamSelect();
    }
  },true);

  window.BatzoFantasyFlow={
    teamSelect,
    captainSelect,
    myTeams,
    closeFlow
  };
})();


/* BATZO_MASTER_FLOW_CONSOLIDATION */
(function(){
  "use strict";

  function goContest(){
    try{
      if(typeof window.openBatzoContest==="function"){
        window.openBatzoContest(
          (window.BATZO_CONTESTS && window.BATZO_CONTESTS[0]) || {
            name:"Mega Contest",
            prize:"₹50 Lakhs",
            entry:"₹49",
            spots:"2.1L",
            joined:"1.84L"
          }
        );
        return true;
      }
    }catch(e){}
    return false;
  }

  function goTeam(){
    try{
      if(typeof window.openBatzoTeam==="function"){
        window.openBatzoTeam("IND vs AUS");
        return true;
      }
    }catch(e){}
    return false;
  }

  document.addEventListener("click",function(e){
    const el=e.target && e.target.closest ? e.target.closest("button,a") : null;
    if(!el) return;

    const text=(el.innerText || el.textContent || "")
      .replace(/\s+/g," ")
      .trim()
      .toUpperCase();

    if(text.includes("VIEW CONTESTS")){
      e.preventDefault();
      e.stopImmediatePropagation();
      goContest();
      return;
    }

    if(text.includes("JOIN CONTEST")){
      e.preventDefault();
      e.stopImmediatePropagation();
      goTeam();
      return;
    }

    if(text.includes("CREATE TEAM") ||
       text.includes("BUILD YOUR XI")){
      e.preventDefault();
      e.stopImmediatePropagation();
      goTeam();
      return;
    }
  },true);
})();
