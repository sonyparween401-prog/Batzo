/*
 BATZO MASTER TEAM / CONTEST FLOW
 Clean authority:
 Home -> View Contests -> Contest -> Create Team
 -> Select XI -> Captain -> Vice Captain -> Save
 -> My Teams -> Select Team -> Contest -> Join
*/

(function () {
  if (window.__BATZO_MASTER_FLOW_V4__) return;
  window.__BATZO_MASTER_FLOW_V4__ = true;

  const TEAM_KEY = "batzo_saved_teams";
  const SELECTED_KEY = "batzo_selected_team";
  const ACTIVE_KEY = "batzo_active_team";
  const PENDING_KEY = "batzo_pending_team";
  const CONTEST_KEY = "batzo_active_contest";
  const JOINED_KEY = "batzo_joined_contests";
  const WALLET_KEY = "batzo_wallet_balance";

  const players = [
    ["Rohit Sharma","BAT","IND",9],
    ["Virat Kohli","BAT","IND",9.5],
    ["KL Rahul","WK","IND",8.5],
    ["Rishabh Pant","WK","IND",9],
    ["Shubman Gill","BAT","IND",9],
    ["Suryakumar Yadav","BAT","IND",9],
    ["Yashasvi Jaiswal","BAT","IND",8.5],
    ["Hardik Pandya","AR","IND",9],
    ["Ravindra Jadeja","AR","IND",9],
    ["Axar Patel","AR","IND",8.5],
    ["Kuldeep Yadav","BOWL","IND",8.5],
    ["Jasprit Bumrah","BOWL","IND",9],
    ["Mohammed Siraj","BOWL","IND",8.5],
    ["Arshdeep Singh","BOWL","IND",8.5],
    ["Travis Head","BAT","AUS",9],
    ["Steve Smith","BAT","AUS",8.5],
    ["David Warner","BAT","AUS",8.5],
    ["Josh Inglis","WK","AUS",8.5],
    ["Mitchell Marsh","AR","AUS",9],
    ["Glenn Maxwell","AR","AUS",9],
    ["Pat Cummins","BOWL","AUS",9],
    ["Mitchell Starc","BOWL","AUS",9],
    ["Josh Hazlewood","BOWL","AUS",8.5],
    ["Adam Zampa","BOWL","AUS",8.5]
  ].map((p,i)=>({
    id:i+1,name:p[0],role:p[1],team:p[2],credit:p[3]
  }));

  const contests = [
    {
      id:"mega-001",
      name:"Mega Contest",
      prize:"₹50 Lakhs",
      entry:49,
      spots:210000,
      joined:184000
    },
    {
      id:"h2h-001",
      name:"Head To Head",
      prize:"₹1,800",
      entry:49,
      spots:2,
      joined:1
    },
    {
      id:"small-001",
      name:"Small Contest",
      prize:"₹25,000",
      entry:99,
      spots:1000,
      joined:642
    }
  ];

  function get(k,d) {
    try {
      const x=localStorage.getItem(k);
      return x===null ? d : JSON.parse(x);
    } catch {
      return d;
    }
  }

  function put(k,v) {
    localStorage.setItem(k,JSON.stringify(v));
  }

  function esc(x) {
    return String(x??"").replace(/[&<>"']/g,m=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",
      '"':"&quot;","'":"&#39;"
    }[m]));
  }

  function root() {
    return document.getElementById("root");
  }

  function roles(list) {
    return list.reduce((a,p)=>{
      a[p.role]=(a[p.role]||0)+1;
      return a;
    },{BAT:0,AR:0,WK:0,BOWL:0});
  }

  function valid(list) {
    if (list.length!==11) return "Team must contain exactly 11 players.";

    const r=roles(list);

    if(r.WK<1||r.WK>4) return "Wicket-Keeper must be 1–4.";
    if(r.BAT<3||r.BAT>6) return "Batter must be 3–6.";
    if(r.AR<1||r.AR>4) return "All-Rounder must be 1–4.";
    if(r.BOWL<3||r.BOWL>6) return "Bowler must be 3–6.";

    const ind=list.filter(x=>x.team==="IND").length;
    const aus=list.filter(x=>x.team==="AUS").length;

    if(ind>7||aus>7) return "Maximum 7 players from one team.";

    const credits=list.reduce((a,x)=>a+Number(x.credit||0),0);
    if(credits>100) return "Credits limit exceeded.";

    return "";
  }

  function toast(msg,ok=true) {
    let x=document.getElementById("batzo-master-toast");
    if(x)x.remove();

    x=document.createElement("div");
    x.id="batzo-master-toast";
    x.textContent=msg;
    x.style.cssText=
      "position:fixed;left:15px;right:15px;bottom:95px;"+
      "z-index:2147483647;padding:15px;border-radius:15px;"+
      "background:"+(ok?"#123d26":"#471b1b")+";color:#fff;"+
      "font-weight:900;text-align:center;box-shadow:0 8px 30px #0008";
    document.body.appendChild(x);
    setTimeout(()=>x.remove(),2500);
  }

  function backButton(id="batzoMasterBack") {
    return `
      <button id="${id}" type="button"
        style="
          border:1px solid #303844;
          background:#111820;
          color:#fff;
          border-radius:12px;
          padding:10px 14px;
          font-weight:900;
        ">
        ← Back
      </button>`;
  }

  function saveTeam(team) {
    const teams=get(TEAM_KEY,[]);
    const id=team.id || ("team-"+Date.now());

    team.id=id;
    team.savedAt=Date.now();

    const next=teams.filter(x=>String(x.id)!==String(id));
    next.unshift(team);

    put(TEAM_KEY,next);
    put(SELECTED_KEY,team);
    put(ACTIVE_KEY,team);
    put(PENDING_KEY,team);

    return team;
  }

  function openMyTeams() {
    const r=root();
    if(!r)return;

    const teams=get(TEAM_KEY,[]);

    r.innerHTML=`
      <div class="bz-flow-screen">
        <div class="bz-flow-head">
          <div>
            <div style="color:#24e778;font-size:12px;font-weight:900;letter-spacing:2px">
              YOUR SQUADS
            </div>
            <h1>My Teams</h1>
          </div>
          ${backButton()}
        </div>

        <div class="bz-flow-card">
          <div style="color:#858d9a;font-size:12px;font-weight:900">
            TOTAL TEAMS
          </div>
          <div style="font-size:28px;font-weight:900;color:#fff">
            ${teams.length}
          </div>
        </div>

        ${
          teams.length
          ? teams.map((team,i)=>{
              const p=team.players||[];
              const rr=roles(p);

              return `
              <div class="bz-flow-card">
                <div style="display:flex;justify-content:space-between;gap:12px">
                  <div>
                    <div style="color:#24e778;font-size:11px;font-weight:900">
                      TEAM ${i+1}
                    </div>
                    <h3 style="color:#fff;margin:5px 0">
                      ${esc(p.slice(0,2).map(x=>x.name).join(" • "))}
                    </h3>
                    <div style="color:#858d9a;font-size:12px">
                      ${p.length}/11 • BAT ${rr.BAT} • AR ${rr.AR}
                      • WK ${rr.WK} • BOWL ${rr.BOWL}
                    </div>
                  </div>
                </div>

                <div style="display:flex;gap:8px;margin-top:14px">
                  <button class="bzUseMasterTeam"
                    data-id="${esc(team.id)}"
                    type="button"
                    style="
                      flex:1;border:0;border-radius:12px;
                      padding:12px;background:#24e778;
                      color:#061009;font-weight:900">
                    USE TEAM
                  </button>

                  <button class="bzEditMasterTeam"
                    data-id="${esc(team.id)}"
                    type="button"
                    style="
                      border:1px solid #303844;border-radius:12px;
                      padding:12px;background:#111820;color:#fff;
                      font-weight:900">
                    EDIT
                  </button>
                </div>
              </div>`;
            }).join("")
          : `
            <div class="bz-flow-card">
              <h3 style="color:#fff">No teams yet</h3>
              <p style="color:#858d9a">
                Create your first fantasy team.
              </p>
            </div>`
        }

        <div class="bz-flow-bottom">
          <button id="bzMasterCreateTeam" type="button"
            style="
              width:100%;border:0;border-radius:14px;
              padding:15px;background:#24e778;
              color:#061009;font-weight:900;font-size:15px">
            + CREATE NEW TEAM
          </button>
        </div>
      </div>`;

    r.querySelector("#bzMasterCreateTeam")
      ?.addEventListener("click",()=>openCreateTeam());

    r.querySelector("#batzoMasterBack")
      ?.addEventListener("click",()=>window.BATZO_MASTER_FLOW.home());

    r.querySelectorAll(".bzUseMasterTeam").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const team=teams.find(x=>String(x.id)===String(btn.dataset.id));
        if(!team)return;

        put(SELECTED_KEY,team);
        put(ACTIVE_KEY,team);

        toast("Team selected successfully.",true);

        setTimeout(()=>openContestList(),300);
      });
    });

    r.querySelectorAll(".bzEditMasterTeam").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const team=teams.find(x=>String(x.id)===String(btn.dataset.id));
        if(team)openCreateTeam(team);
      });
    });

    r.querySelector("#batzoMasterBack")
      ?.addEventListener("click",()=>window.BATZO_MASTER_FLOW.home());
  }

  function openCreateTeam(existing=null) {
    const r=root();
    if(!r)return;

    let selected=new Set((existing?.players||[]).map(x=>x.id));
    let captain=existing?.captain ?? null;
    let vice=existing?.viceCaptain ?? null;
    let role="ALL";

    function render() {
      const rr=roles([...selected].map(id=>players.find(p=>p.id===id)).filter(Boolean));
      const list=[...selected].map(id=>players.find(p=>p.id===id)).filter(Boolean);
      const credits=list.reduce((a,x)=>a+x.credit,0);

      r.innerHTML=`
        <div class="bz-flow-screen">

          <div class="bz-flow-head">
            <div>
              <div style="color:#24e778;font-size:12px;font-weight:900;letter-spacing:2px">
                BATZO CRICKET
              </div>
              <h1>${existing?"Edit Team":"Create Team"}</h1>
              <div style="color:#858d9a">
                IND vs AUS
              </div>
            </div>
            ${backButton()}
          </div>

          <div class="bz-flow-card" style="position:sticky;top:0;z-index:10">

            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${["ALL","BAT","AR","WK","BOWL"].map(x=>`
                <button class="bzMasterRole" data-role="${x}" type="button"
                  style="
                    border:1px solid #303844;
                    border-radius:10px;
                    padding:8px 10px;
                    background:${role===x?"#24e778":"#111820"};
                    color:${role===x?"#061009":"#fff"};
                    font-weight:900">
                  ${x}
                </button>`).join("")}
            </div>

            <div style="color:#fff;font-weight:900;margin-top:10px">
              ${selected.size}/11 Players
            </div>

            <div style="color:#ffd43b;font-size:12px;margin-top:4px">
              Credits ${credits.toFixed(1)}/100 •
              BAT ${rr.BAT} • AR ${rr.AR} •
              WK ${rr.WK} • BOWL ${rr.BOWL}
            </div>
          </div>

          <div>
            ${players.filter(p=>role==="ALL"||p.role===role).map(p=>{
              const on=selected.has(p.id);
              return `
              <button class="bzMasterPlayer"
                data-id="${p.id}" type="button"
                style="
                  width:100%;display:flex;align-items:center;
                  justify-content:space-between;margin:6px 0;
                  padding:13px;border-radius:14px;
                  border:1px solid ${on?"#24e778":"#29313a"};
                  background:${on?"#102719":"#111820"};
                  color:#fff;text-align:left">

                <span>
                  <b>${esc(p.name)}</b>
                  <small style="display:block;color:#858d9a">
                    ${p.role} • ${p.team} • ${p.credit} CR
                  </small>
                </span>

                <strong style="color:${on?"#24e778":"#858d9a"}">
                  ${on?"✓":"+"}
                </strong>
              </button>`;
            }).join("")}
          </div>

          <div class="bz-flow-bottom">
            <button id="bzMasterContinue" type="button"
              style="
                width:100%;border:0;border-radius:14px;
                padding:15px;background:#24e778;
                color:#061009;font-weight:900;font-size:15px">
              CONTINUE • ${selected.size}/11
            </button>
          </div>
        </div>`;

      r.querySelectorAll(".bzMasterRole").forEach(b=>{
        b.addEventListener("click",()=>{
          role=b.dataset.role;
          render();
        });
      });

      r.querySelectorAll(".bzMasterPlayer").forEach(b=>{
        b.addEventListener("click",()=>{
          const id=Number(b.dataset.id);

          if(selected.has(id)){
            selected.delete(id);
          } else {
            if(selected.size>=11){
              toast("Maximum 11 players.",false);
              return;
            }

            selected.add(id);
          }

          render();
        });
      });

      r.querySelector("#bzMasterContinue")
        ?.addEventListener("click",()=>{
          const list=[...selected]
            .map(id=>players.find(p=>p.id===id))
            .filter(Boolean);

          const error=valid(list);

          if(error){
            toast(error,false);
            return;
          }

          openCVC({
            id:existing?.id,
            players:list,
            captain,
            viceCaptain:vice
          });
        });

      r.querySelector("#batzoMasterBack")
        ?.addEventListener("click",()=>{
          existing ? openMyTeams() : openContestList();
        });
    }

    render();
  }

  function openCVC(team) {
    const r=root();
    if(!r)return;

    let captain=team.captain;
    let vice=team.viceCaptain;

    function render(){
      r.innerHTML=`
        <div class="bz-flow-screen">

          <div class="bz-flow-head">
            <div>
              <div style="color:#24e778;font-size:12px;font-weight:900">
                FINAL STEP
              </div>
              <h1>Captain & Vice-Captain</h1>
            </div>
            ${backButton()}
          </div>

          <div class="bz-flow-card">
            <p style="color:#858d9a">
              Select one Captain and one Vice-Captain.
            </p>

            ${team.players.map(p=>`
              <div style="
                display:flex;align-items:center;
                justify-content:space-between;
                gap:8px;padding:10px 0;
                border-bottom:1px solid #252c35">

                <div>
                  <b style="color:#fff">${esc(p.name)}</b>
                  <small style="display:block;color:#858d9a">
                    ${p.role} • ${p.team}
                  </small>
                </div>

                <div style="display:flex;gap:6px">
                  <button class="bzCap"
                    data-id="${p.id}" type="button"
                    style="
                      padding:8px 10px;border-radius:9px;
                      border:1px solid ${captain===p.id?"#24e778":"#303844"};
                      background:${captain===p.id?"#24e778":"#111820"};
                      color:${captain===p.id?"#061009":"#fff"};
                      font-weight:900">
                    C
                  </button>

                  <button class="bzVC"
                    data-id="${p.id}" type="button"
                    style="
                      padding:8px 10px;border-radius:9px;
                      border:1px solid ${vice===p.id?"#ffd43b":"#303844"};
                      background:${vice===p.id?"#ffd43b":"#111820"};
                      color:${vice===p.id?"#061009":"#fff"};
                      font-weight:900">
                    VC
                  </button>
                </div>
              </div>`).join("")}
          </div>

          <div class="bz-flow-card">
            <div style="color:#fff;font-weight:900">
              Captain:
              ${team.players.find(p=>p.id===captain)?.name||"Not selected"}
            </div>
            <div style="color:#fff;font-weight:900;margin-top:6px">
              Vice-Captain:
              ${team.players.find(p=>p.id===vice)?.name||"Not selected"}
            </div>
          </div>

          <div class="bz-flow-bottom">
            <button id="bzMasterSaveTeam" type="button"
              style="
                width:100%;border:0;border-radius:14px;
                padding:15px;background:#24e778;
                color:#061009;font-weight:900;font-size:15px">
              SAVE TEAM
            </button>
          </div>
        </div>`;

      r.querySelectorAll(".bzCap").forEach(b=>{
        b.addEventListener("click",()=>{
          captain=Number(b.dataset.id);
          if(vice===captain)vice=null;
          render();
        });
      });

      r.querySelectorAll(".bzVC").forEach(b=>{
        b.addEventListener("click",()=>{
          const id=Number(b.dataset.id);
          if(captain===id){
            toast("Captain and Vice-Captain must be different.",false);
            return;
          }
          vice=id;
          render();
        });
      });

      r.querySelector("#bzMasterSaveTeam")
        ?.addEventListener("click",()=>{
          if(captain===null||captain===undefined){
            toast("Select Captain.",false);
            return;
          }

          if(vice===null||vice===undefined){
            toast("Select Vice-Captain.",false);
            return;
          }

          if(captain===vice){
            toast("Captain and Vice-Captain must be different.",false);
            return;
          }

          team.captain=captain;
          team.viceCaptain=vice;

          const saved=saveTeam(team);

          window.BATZO_ACTIVE_TEAM=saved;
          window.BATZO_PENDING_TEAM=saved;

          toast("TEAM SAVED SUCCESSFULLY.",true);

          setTimeout(()=>openMyTeams(),500);
        });

      r.querySelector("#batzoMasterBack")
        ?.addEventListener("click",()=>openCreateTeam(team));
    }

    render();
  }

  function openContestList() {
    const r=root();
    if(!r)return;

    const selected=get(SELECTED_KEY,null);
    const teams=get(TEAM_KEY,[]);

    r.innerHTML=`
      <div class="bz-flow-screen">

        <div class="bz-flow-head">
          <div>
            <div style="color:#24e778;font-size:12px;font-weight:900">
              BATZO CRICKET
            </div>
            <h1>Contests</h1>
          </div>
          ${backButton()}
        </div>

        <div class="bz-flow-card">
          <div style="color:#858d9a;font-size:11px;font-weight:900">
            SELECTED TEAM
          </div>

          <div style="color:#fff;font-size:18px;font-weight:900;margin-top:6px">
            ${
              selected
              ? esc((selected.players||[]).slice(0,2).map(x=>x.name).join(" • "))
              : "No team selected"
            }
          </div>

          <div style="color:#24e778;font-size:12px;margin-top:6px">
            MY TEAMS: ${teams.length}
          </div>
        </div>

        ${contests.map(c=>`
          <button class="bzMasterContest"
            data-id="${esc(c.id)}" type="button"
            style="
              width:100%;text-align:left;
              margin:7px 0;padding:16px;
              border:1px solid #29313a;
              border-radius:16px;
              background:#111820;color:#fff">

            <div style="color:#858d9a;font-size:10px;font-weight:900">
              WINNING PRIZE
            </div>

            <div style="font-size:25px;font-weight:900;color:#fff">
              ${esc(c.prize)}
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:10px">
              <b>${esc(c.name)}</b>
              <b style="color:#24e778">JOIN ₹${c.entry}</b>
            </div>

            <div style="color:#858d9a;font-size:11px;margin-top:7px">
              ${c.joined} joined • ${c.spots} spots
            </div>
          </button>`).join("")}

        <div class="bz-flow-bottom">
          <button id="bzMasterMyTeams" type="button"
            style="
              width:100%;border:1px solid #303844;
              border-radius:14px;padding:14px;
              background:#111820;color:#fff;font-weight:900">
            MY TEAMS (${teams.length})
          </button>
        </div>
      </div>`;

    r.querySelectorAll(".bzMasterContest").forEach(b=>{
      b.addEventListener("click",()=>{
        const c=contests.find(x=>x.id===b.dataset.id);
        if(c)openContest(c);
      });
    });

    r.querySelector("#bzMasterMyTeams")
      ?.addEventListener("click",openMyTeams);

    r.querySelector("#batzoMasterBack")
      ?.addEventListener("click",()=>window.BATZO_MASTER_FLOW.home());
  }

  function openContest(contest) {
    const r=root();
    if(!r)return;

    put(CONTEST_KEY,contest);

    const selected=get(SELECTED_KEY,null);
    const teams=get(TEAM_KEY,[]);

    r.innerHTML=`
      <div class="bz-flow-screen">

        <div class="bz-flow-head">
          <div>
            <div style="color:#24e778;font-size:12px;font-weight:900">
              CONTEST
            </div>
            <h1>${esc(contest.name)}</h1>
          </div>
          ${backButton()}
        </div>

        <div class="bz-flow-card">
          <div style="color:#858d9a;font-size:11px;font-weight:900">
            WINNING PRIZE
          </div>

          <div style="font-size:32px;font-weight:900;color:#fff">
            ${esc(contest.prize)}
          </div>

          <div style="margin-top:14px;color:#858d9a">
            Entry Fee
          </div>

          <div style="font-size:24px;font-weight:900;color:#24e778">
            ₹${contest.entry}
          </div>

          <div style="
            display:flex;justify-content:space-between;
            margin-top:15px;color:#858d9a;font-size:12px">
            <span>${contest.spots} SPOTS</span>
            <span>${contest.joined} JOINED</span>
          </div>
        </div>

        <div class="bz-flow-card">
          <h3 style="color:#fff">SELECT TEAM</h3>

          ${
            selected
            ? `
              <div style="
                padding:12px;border:1px solid #24e778;
                border-radius:12px;color:#fff">
                <b>Selected Team</b>
                <div style="color:#858d9a;margin-top:4px">
                  ${(selected.players||[]).length}/11 players
                </div>
              </div>`
            : `
              <div style="color:#858d9a">
                No team selected.
              </div>`
          }

          <button id="bzMasterChooseTeam" type="button"
            style="
              width:100%;margin-top:12px;
              padding:13px;border-radius:12px;
              border:1px solid #303844;
              background:#111820;color:#fff;font-weight:900">
            ${
              selected
              ? "CHANGE TEAM"
              : "SELECT / CREATE TEAM"
            }
          </button>
        </div>

        <div class="bz-flow-bottom">
          <button id="bzMasterJoin" type="button"
            style="
              width:100%;border:0;border-radius:14px;
              padding:16px;background:#24e778;
              color:#061009;font-weight:900;font-size:15px">
            JOIN CONTEST • ₹${contest.entry}
          </button>
        </div>
      </div>`;

    r.querySelector("#bzMasterChooseTeam")
      ?.addEventListener("click",openMyTeams);

    r.querySelector("#bzMasterJoin")
      ?.addEventListener("click",()=>{
        joinContest(contest);
      });

    r.querySelector("#batzoMasterBack")
      ?.addEventListener("click",openContestList);
  }

  function joinContest(contest) {
    const team=get(SELECTED_KEY,null);

    if(!team){
      toast("Please select or create a team first.",false);
      openMyTeams();
      return;
    }

    if(!Array.isArray(team.players)||team.players.length!==11){
      toast("Selected team must contain 11 players.",false);
      openMyTeams();
      return;
    }

    const error=valid(team.players);
    if(error){
      toast(error,false);
      return;
    }

    if(team.captain===null||team.captain===undefined||
       team.viceCaptain===null||team.viceCaptain===undefined){
      toast("Captain and Vice-Captain are required.",false);
      openCVC(team);
      return;
    }

    if(team.captain===team.viceCaptain){
      toast("Captain and Vice-Captain must be different.",false);
      openCVC(team);
      return;
    }

    const wallet=Number(localStorage.getItem(WALLET_KEY)||0);

    if(wallet < Number(contest.entry)){
      toast(
        "Insufficient wallet balance. Entry fee ₹"+contest.entry,
        false
      );
      return;
    }

    const joined=get(JOINED_KEY,[]);

    const already=joined.some(x=>
      String(x.contestId)===String(contest.id) &&
      String(x.teamId)===String(team.id)
    );

    if(already){
      toast("This team is already joined in this contest.",true);
      return;
    }

    localStorage.setItem(
      WALLET_KEY,
      String((wallet-Number(contest.entry)).toFixed(2))
    );

    joined.push({
      contestId:contest.id,
      contestName:contest.name,
      teamId:team.id,
      team:team,
      entry:Number(contest.entry),
      joinedAt:Date.now()
    });

    put(JOINED_KEY,joined);
    put(CONTEST_KEY,contest);

    toast(
      "CONTEST JOINED SUCCESSFULLY • ₹"+contest.entry+" deducted",
      true
    );

    setTimeout(()=>openContestList(),700);
  }

  function home() {
    window.dispatchEvent(
      new CustomEvent("batzo:master-home")
    );

    setTimeout(()=>{
      const buttons=[...document.querySelectorAll("button,a")];
      const b=buttons.find(x=>
        /HOME/i.test((x.innerText||x.textContent||"").trim())
      );

      if(b)b.click();
      else window.scrollTo(0,0);
    },50);
  }

  /*
   IMPORTANT:
   We only intercept the exact broken flow buttons.
   React/home navigation remains untouched.
  */
  document.addEventListener("click",function(ev){
    const el=ev.target?.closest?.("button,a");
    if(!el)return;

    const text=(el.innerText||el.textContent||"")
      .replace(/\s+/g," ")
      .trim()
      .toUpperCase();

    const id=(el.id||"").toUpperCase();

    if(
      id==="BATZOCREATENEWTEAM" ||
      text==="CREATE NEW TEAM" ||
      text.includes("CREATE NEW TEAM") ||
      text==="CREATE TEAM" ||
      text.includes("BUILD YOUR XI")
    ){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      openCreateTeam();
      return;
    }

    if(
      text==="MY TEAMS" ||
      text.includes("MY TEAMS")
    ){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      openMyTeams();
      return;
    }

    if(
      text.includes("VIEW CONTESTS") ||
      text.includes("VIEW CONTEST") ||
      text.includes("JOIN CONTEST") ||
      text==="JOIN NOW"
    ){
      ev.preventDefault();
      ev.stopImmediatePropagation();

      const selected=get(SELECTED_KEY,null);

      if(text.includes("JOIN CONTEST") && selected){
        openContest(get(CONTEST_KEY,contests[0]));
      } else {
        openContestList();
      }

      return;
    }
  },true);

  /*
   Android hardware back.
   The top Back button and Android back both use the same history.
  */
  let stack=[];

  function push(fn){
    stack.push(fn);
  }

  window.BATZO_MASTER_FLOW={
    home,
    openCreateTeam,
    openCVC,
    openMyTeams,
    openContestList,
    openContest,
    joinContest,
    push
  };

  document.addEventListener("click",ev=>{
    const b=ev.target?.closest?.("#batzoMasterBack");
    if(!b)return;

    ev.preventDefault();
    ev.stopPropagation();

    if(stack.length){
      const fn=stack.pop();
      fn();
    } else {
      home();
    }
  },true);

  /*
   Keep selected/active team synchronized.
  */
  window.addEventListener("batzo:team",()=>{
    setTimeout(()=>{
      const t=get(SELECTED_KEY,null);
      if(t){
        put(ACTIVE_KEY,t);
        window.BATZO_ACTIVE_TEAM=t;
      }
    },30);
  });

  console.log("BATZO MASTER TEAM/CONTEST FLOW V4 READY");
})();
