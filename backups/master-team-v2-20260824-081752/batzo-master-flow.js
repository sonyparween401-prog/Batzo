(function(){
  'use strict';

  if(window.__BATZO_MASTER_FLOW__) return;
  window.__BATZO_MASTER_FLOW__=true;

  const PLAYERS=[
    ['Rohit Sharma','Batter','IND','9.5'],
    ['Virat Kohli','Batter','IND','9.5'],
    ['Jasprit Bumrah','Bowler','IND','9.0'],
    ['Hardik Pandya','All-rounder','IND','9.0'],
    ['KL Rahul','Wicket-keeper','IND','8.5'],
    ['Shubman Gill','Batter','IND','9.0'],
    ['Ravindra Jadeja','All-rounder','IND','9.0'],
    ['Kuldeep Yadav','Bowler','IND','8.5'],
    ['Travis Head','Batter','AUS','9.0'],
    ['Pat Cummins','Bowler','AUS','9.0'],
    ['Glenn Maxwell','All-rounder','AUS','9.0'],
    ['Mitchell Starc','Bowler','AUS','9.0'],
    ['Steve Smith','Batter','AUS','9.0'],
    ['Alex Carey','Wicket-keeper','AUS','8.5'],
    ['Josh Hazlewood','Bowler','AUS','8.5'],
    ['Mitchell Marsh','All-rounder','AUS','9.0'],
    ['David Warner','Batter','AUS','9.0'],
    ['Adam Zampa','Bowler','AUS','8.5']
  ].map((p,i)=>({
    id:'p'+i,
    name:p[0],
    role:p[1],
    team:p[2],
    credit:Number(p[3])
  }));

  const CONTEST={
    id:'batzo-master-contest',
    name:'Mega Contest',
    prize:'₹50 Lakhs',
    entry:'₹49',
    spots:'2.1L',
    joined:'1.84L'
  };

  const TEAM_KEY='batzo_saved_teams';
  const SELECTED_KEY='batzo_selected_team';
  const ACTIVE_KEY='batzo_active_team';
  const WALLET_KEY='batzo_wallet_balance';
  const JOINED_KEY='batzo_joined_contests';

  const root=()=>document.getElementById('root');

  const read=(k,d)=>{
    try{
      const v=localStorage.getItem(k);
      return v===null?d:JSON.parse(v);
    }catch{
      return d;
    }
  };

  const write=(k,v)=>{
    try{
      localStorage.setItem(k,JSON.stringify(v));
      return true;
    }catch{
      return false;
    }
  };

  const teams=()=>{
    const x=read(TEAM_KEY,[]);
    return Array.isArray(x)?x:[];
  };

  const wallet=()=>{
    const n=Number(localStorage.getItem(WALLET_KEY)||0);
    return Number.isFinite(n)&&n>=0?n:0;
  };

  const setWallet=n=>{
    localStorage.setItem(
      WALLET_KEY,
      String(Math.max(0,Number(n)||0).toFixed(2))
    );
  };

  const esc=s=>String(s??'').replace(
    /[&<>"']/g,
    c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[c])
  );

  const playerName=i=>PLAYERS[i]?.name||'';

  function shell(title,sub,body,bottom=''){
    const r=root();
    if(!r)return;

    r.innerHTML=`
      <div class="bzm-screen">
        <div class="bzm-head">
          <div>
            <div class="bzm-brand">BATZO CRICKET</div>
            <h1>${esc(title)}</h1>
            ${sub?`<div class="bz-sub">${esc(sub)}</div>`:''}
          </div>
        </div>

        <div class="bzm-body">${body}</div>

        ${
          bottom
          ? `<div class="bzm-bottom">${bottom}</div>`
          : ''
        }
      </div>
    `;

    r.scrollTop=0;
  }

  function toast(msg,ok=false){
    const old=document.getElementById('bzMasterToast');
    if(old)old.remove();

    const d=document.createElement('div');
    d.id='bzMasterToast';
    d.textContent=msg;

    d.style.cssText=
      'position:fixed;left:14px;right:14px;bottom:92px;'+
      'z-index:2147483647;padding:14px 16px;border-radius:15px;'+
      'background:'+(ok?'#123d26':'#461b1b')+';color:#fff;'+
      'font-weight:900;text-align:center;'+
      'box-shadow:0 10px 35px rgba(0,0,0,.5)';

    document.body.appendChild(d);

    setTimeout(()=>d.remove(),2600);
  }

  function teamsPage(){

    const list=teams();

    let body=`
      <div class="bzm-card">
        <div class="bz-label">YOUR SQUADS</div>
        <div class="bz-big">
          ${list.length}
          TEAM${list.length===1?'':'S'}
        </div>
        <div class="bz-muted">
          Edit or delete any saved team.
          Create Team always requires exactly 11 players.
        </div>
      </div>
    `;

    if(!list.length){
      body+=`
        <div class="bzm-card">
          <div class="bz-empty">
            No saved teams yet.
          </div>
        </div>
      `;
    }

    list.forEach((t,i)=>{

      const ps=Array.isArray(t.players)?t.players:[];

      const c=t.captain;
      const vc=t.viceCaptain;

      body+=`
        <div class="bzm-card team-card">

          <div class="team-title">
            <b>TEAM ${i+1}</b>
            <span>${ps.length}/11 PLAYERS</span>
          </div>

          <div class="team-names">
            ${
              ps.slice(0,11).map((p,j)=>`
                <span>
                  ${esc(p.name||playerName(p))}
                  ${j===c?' <b>(C)</b>':''}
                  ${j===vc?' <b>(VC)</b>':''}
                </span>
              `).join('')
            }
          </div>

          <div class="team-actions">
            <button
              class="bz-edit"
              data-edit="${i}">
              EDIT TEAM
            </button>

            <button
              class="bz-delete"
              data-delete="${i}">
              DELETE
            </button>
          </div>

        </div>
      `;
    });

    shell(
      'My Teams',
      'Manage your saved fantasy teams',
      body,
      `<button class="bz-primary" id="bzCreate">
        CREATE TEAM →
      </button>`
    );

    document.getElementById('bzCreate').onclick=()=>{
      teamBuilder(null);
    };

    document.querySelectorAll('[data-edit]').forEach(b=>{
      b.onclick=()=>{
        teamBuilder(Number(b.dataset.edit));
      };
    });

    document.querySelectorAll('[data-delete]').forEach(b=>{
      b.onclick=()=>{
        const i=Number(b.dataset.delete);
        const a=teams();

        if(!a[i])return;

        if(!confirm('Delete Team '+(i+1)+'?'))return;

        a.splice(i,1);
        write(TEAM_KEY,a);

        const sel=read(SELECTED_KEY,null);

        if(sel && !a.some(x=>x.id===sel.id)){
          localStorage.removeItem(SELECTED_KEY);
          localStorage.removeItem(ACTIVE_KEY);
        }

        toast('TEAM DELETED',true);

        setTimeout(teamsPage,150);
      };
    });
  }

  function teamBuilder(editIndex){

    const old=
      editIndex===null
      ? null
      : teams()[editIndex];

    let selected=new Set();

    if(old && Array.isArray(old.players)){
      old.players.forEach(p=>{
        const n=typeof p==='string'?p:p.name;
        const ix=PLAYERS.findIndex(x=>x.name===n);
        if(ix>=0)selected.add(ix);
      });
    }

    const body=`
      <div class="bzm-card">
        <div class="bz-label">SELECT YOUR XI</div>

        <div class="bz-big" id="bzCount">
          ${selected.size}/11
        </div>

        <div class="bz-muted">
          Select exactly 11 players.
        </div>
      </div>

      <div id="bzPlayerList"></div>
    `;

    shell(
      editIndex===null?'Create Team':'Edit Team',
      'Choose 11 players',
      body,
      `<button class="bz-primary" id="bzPlayersNext">
        CONTINUE • ${selected.size}/11
      </button>`
    );

    const list=document.getElementById('bzPlayerList');

    PLAYERS.forEach((p,i)=>{

      const d=document.createElement('div');

      d.className=
        'bz-player '+
        (selected.has(i)?'picked':'');

      d.innerHTML=`
        <div>
          <b>${esc(p.name)}</b>
          <small>
            ${esc(p.team)} •
            ${esc(p.role)} •
            ${p.credit} Cr
          </small>
        </div>

        <button type="button">
          ${selected.has(i)?'✓':'ADD'}
        </button>
      `;

      d.querySelector('button').onclick=()=>{

        if(selected.has(i)){
          selected.delete(i);
        }else{
          if(selected.size>=11){
            return toast('Maximum 11 players');
          }
          selected.add(i);
        }

        d.classList.toggle(
          'picked',
          selected.has(i)
        );

        d.querySelector('button').textContent=
          selected.has(i)?'✓':'ADD';

        document.getElementById('bzCount')
          .textContent=selected.size+'/11';

        document.getElementById('bzPlayersNext')
          .textContent=
          'CONTINUE • '+selected.size+'/11';
      };

      list.appendChild(d);
    });

    document.getElementById('bzPlayersNext').onclick=()=>{

      if(selected.size!==11){
        return toast(
          'Please select exactly 11 players'
        );
      }

      captainStep(
        editIndex,
        [...selected]
      );
    };
  }

  function captainStep(editIndex,idxs){

    const old=
      editIndex===null
      ? null
      : teams()[editIndex];

    let c=null;
    let vc=null;

    if(old && Array.isArray(old.players)){

      const cp=old.players[old.captain];
      const vp=old.players[old.viceCaptain];

      const cn=
        typeof cp==='string'
        ? cp
        : cp?.name;

      const vn=
        typeof vp==='string'
        ? vp
        : vp?.name;

      const ci=
        PLAYERS.findIndex(
          x=>x.name===cn
        );

      const vi=
        PLAYERS.findIndex(
          x=>x.name===vn
        );

      if(idxs.includes(ci))c=ci;
      if(idxs.includes(vi))vc=vi;
    }

    const body=`
      <div class="bzm-card">

        <div class="bz-label">
          LEADERS
        </div>

        <div class="bz-big">
          CAPTAIN
        </div>

        <div class="bz-muted">
          Pick one Captain and one different
          Vice-Captain.
        </div>

      </div>

      <div id="bzCVList"></div>
    `;

    shell(
      editIndex===null
      ? 'Captain & Vice-Captain'
      : 'Edit Captain & Vice-Captain',
      'Set C and VC before confirming',
      body,
      `<button class="bz-primary" id="bzConfirm">
        CONFIRM TEAM
      </button>`
    );

    const list=document.getElementById('bzCVList');

    idxs.forEach(i=>{

      const p=PLAYERS[i];

      const d=document.createElement('div');

      d.className='bz-player';

      d.innerHTML=`
        <div>
          <b>${esc(p.name)}</b>
          <small>
            ${p.team} • ${p.role}
          </small>
        </div>

        <div class="cv">

          <button
            class="${c===i?'on':''}"
            data-c>
            C
          </button>

          <button
            class="${vc===i?'on':''}"
            data-vc>
            VC
          </button>

        </div>
      `;

      d.querySelector('[data-c]').onclick=()=>{

        c=i;

        document
          .querySelectorAll('[data-c]')
          .forEach(x=>{
            x.classList.remove('on');
          });

        d.querySelector('[data-c]')
          .classList.add('on');
      };

      d.querySelector('[data-vc]').onclick=()=>{

        vc=i;

        document
          .querySelectorAll('[data-vc]')
          .forEach(x=>{
            x.classList.remove('on');
          });

        d.querySelector('[data-vc]')
          .classList.add('on');
      };

      list.appendChild(d);
    });

    document.getElementById('bzConfirm').onclick=()=>{

      if(c===null){
        return toast(
          'Please select Captain'
        );
      }

      if(vc===null){
        return toast(
          'Please select Vice-Captain'
        );
      }

      if(c===vc){
        return toast(
          'Captain and Vice-Captain must be different'
        );
      }

      const a=teams();

      const team={
        id:
          old?.id ||
          ('team-'+Date.now()),

        players:
          idxs.map(i=>PLAYERS[i]),

        captain:
          idxs.indexOf(c),

        viceCaptain:
          idxs.indexOf(vc),

        createdAt:
          old?.createdAt ||
          Date.now(),

        updatedAt:
          Date.now()
      };

      if(editIndex===null){
        a.unshift(team);
      }else{
        a[editIndex]=team;
      }

      write(TEAM_KEY,a);
      write(SELECTED_KEY,team);
      write(ACTIVE_KEY,team);

      window.BATZO_PENDING_TEAM=team;

      toast(
        'TEAM CONFIRMED',
        true
      );

      setTimeout(
        ()=>contestPage(),
        350
      );
    };
  }

  function contestPage(){

    const t=CONTEST;

    const team=
      read(
        SELECTED_KEY,
        null
      );

    if(
      !team ||
      !Array.isArray(team.players) ||
      team.players.length!==11
    ){
      return teamsPage();
    }

    const joined=
      read(JOINED_KEY,[]);

    const already=
      Array.isArray(joined) &&
      joined.some(x=>
        String(x.contestId)===String(t.id) &&
        String(x.team?.id)===String(team.id)
      );

    const body=`

      <div class="bzm-card">

        <div class="bz-label">
          CONTEST
        </div>

        <div class="bz-big">
          ${esc(t.name)}
        </div>

        <div class="prize">
          ${esc(t.prize)}
        </div>

        <div class="stats">

          <span>
            <b>${esc(t.entry)}</b>
            <small>ENTRY</small>
          </span>

          <span>
            <b>${esc(t.spots)}</b>
            <small>SPOTS</small>
          </span>

          <span>
            <b>11</b>
            <small>PLAYERS</small>
          </span>

        </div>

      </div>

      <div class="bzm-card">

        <div class="bz-label">
          TEAM READY
        </div>

        <div class="bz-muted">
          ${esc(
            team.players[team.captain]?.name ||
            'Captain'
          )}
          (C)
          •
          ${esc(
            team.players[team.viceCaptain]?.name ||
            'Vice-Captain'
          )}
          (VC)
        </div>

        <div class="bz-wallet">
          Wallet ₹${wallet().toFixed(2)}
        </div>

      </div>

      ${
        already
        ? `
          <div class="bzm-card ok">
            THIS TEAM IS ALREADY JOINED.
          </div>
        `
        : ''
      }
    `;

    /*
      IMPORTANT:
      NO BACK BUTTON HERE.
    */

    shell(
      t.name,
      'Confirmed team is ready to join',
      body,
      already
      ? `
        <button
          class="bz-primary"
          disabled>
          ALREADY JOINED
        </button>
      `
      : `
        <button
          class="bz-primary"
          id="bzJoinMaster">
          JOIN CONTEST • ${esc(t.entry)}
        </button>
      `
    );

    const j=
      document.getElementById(
        'bzJoinMaster'
      );

    if(j){
      j.onclick=()=>joinContest();
    }
  }

  function joinContest(){

    const team=
      read(
        SELECTED_KEY,
        null
      );

    if(
      !team ||
      !Array.isArray(team.players) ||
      team.players.length!==11
    ){
      return toast(
        'Create and confirm a team first'
      );
    }

    const fee=49;
    const bal=wallet();

    if(bal<fee){
      return toast(
        'Insufficient wallet balance • Required ₹49'
      );
    }

    let joined=
      read(
        JOINED_KEY,
        []
      );

    if(!Array.isArray(joined)){
      joined=[];
    }

    if(
      joined.some(x=>
        String(x.contestId)===CONTEST.id &&
        String(x.team?.id)===String(team.id)
      )
    ){
      return toast(
        'This team is already joined'
      );
    }

    setWallet(
      bal-fee
    );

    joined.push({
      contestId:CONTEST.id,
      contestName:CONTEST.name,
      entry:fee,
      team:team,
      joinedAt:Date.now()
    });

    write(
      JOINED_KEY,
      joined
    );

    write(
      'batzo_last_joined_contest',
      CONTEST
    );

    toast(
      'CONTEST JOINED • ₹49 deducted',
      true
    );

    setTimeout(
      contestPage,
      900
    );
  }

  function intercept(){

    document.addEventListener(
      'click',
      function(ev){

        const el=
          ev.target.closest &&
          ev.target.closest('button,a');

        if(!el)return;

        const text=
          (
            el.innerText ||
            el.textContent ||
            ''
          )
          .replace(/\s+/g,' ')
          .trim()
          .toUpperCase();

        if(
          text==='MY TEAMS' ||
          text.includes('MY TEAMS')
        ){
          setTimeout(
            teamsPage,
            30
          );
          return;
        }

        if(
          text.includes('CREATE TEAM') ||
          text.includes('BUILD YOUR XI')
        ){
          setTimeout(
            ()=>teamBuilder(null),
            30
          );
          return;
        }

        if(
          text.includes('JOIN CONTEST') ||
          text==='JOIN NOW'
        ){

          if(el.id==='bzJoinMaster'){
            return;
          }

          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();

          setTimeout(
            contestPage,
            0
          );

          return;
        }

        if(
          text.includes('VIEW CONTEST') ||
          text==='CONTESTS'
        ){

          setTimeout(
            contestPage,
            30
          );

          return;
        }

        if(
          text.includes('CONFIRM TEAM')
        ){

          if(el.id==='bzConfirm'){
            return;
          }

          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();

          return;
        }

      },
      true
    );
  }

  const style=
    document.createElement('style');

  style.textContent=`

    .bzm-screen{
      min-height:100vh;
      background:#070a0d;
      color:#fff;
      padding:18px 14px 110px;
      font-family:system-ui,-apple-system,
      Segoe UI,sans-serif;
      box-sizing:border-box
    }

    .bzm-head{
      padding:8px 4px 16px
    }

    .bzm-brand{
      color:#24e778;
      font-size:11px;
      font-weight:900;
      letter-spacing:2px
    }

    .bzm-head h1{
      margin:5px 0 0;
      font-size:28px
    }

    .bz-sub{
      color:#8f97a5;
      font-size:12px;
      margin-top:4px
    }

    .bzm-body{
      max-width:700px;
      margin:auto
    }

    .bzm-card{
      background:
        linear-gradient(
          145deg,
          #121920,
          #0b1014
        );
      border:1px solid #29323b;
      border-radius:18px;
      padding:16px;
      margin:10px 0;
      box-shadow:
        0 8px 28px rgba(0,0,0,.22)
    }

    .bz-label{
      font-size:10px;
      color:#8f97a5;
      font-weight:900;
      letter-spacing:1.7px
    }

    .bz-big{
      font-size:23px;
      font-weight:950;
      margin-top:5px
    }

    .bz-muted{
      color:#a1a8b4;
      font-size:13px;
      line-height:1.5;
      margin-top:6px
    }

    .bz-empty{
      text-align:center;
      color:#9aa3ae;
      padding:20px
    }

    .team-title{
      display:flex;
      justify-content:space-between;
      align-items:center
    }

    .team-title span{
      color:#8f97a5;
      font-size:10px
    }

    .team-names{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:7px;
      margin-top:12px
    }

    .team-names span{
      font-size:11px;
      color:#d6dbe0;
      background:#0b0f13;
      padding:8px;
      border-radius:9px
    }

    .team-actions{
      display:flex;
      gap:8px;
      margin-top:12px
    }

    .team-actions button,
    .cv button,
    .bz-player button{
      border:0;
      border-radius:10px;
      font-weight:900;
      padding:10px 12px
    }

    .bz-edit{
      background:#183b2b;
      color:#72f0aa;
      flex:1
    }

    .bz-delete{
      background:#401d21;
      color:#ff8c96
    }

    .bz-player{
      display:flex;
      justify-content:space-between;
      align-items:center;
      background:#11171c;
      border:1px solid #242d35;
      border-radius:14px;
      padding:11px 12px;
      margin:7px 0
    }

    .bz-player.picked{
      border-color:#24e778;
      background:#0f2118
    }

    .bz-player b{
      display:block;
      font-size:13px
    }

    .bz-player small{
      display:block;
      color:#89929e;
      font-size:10px;
      margin-top:3px
    }

    .bz-player>button{
      background:#1c252c;
      color:#dbe2e8;
      min-width:58px
    }

    .bz-player.picked>button{
      background:#24e778;
      color:#06100a
    }

    .cv{
      display:flex;
      gap:7px
    }

    .cv button{
      background:#20282f;
      color:#fff
    }

    .cv button.on{
      background:#24e778;
      color:#06100a
    }

    .bz-primary{
      width:100%;
      border:0;
      border-radius:15px;
      padding:15px;
      background:#24e778;
      color:#06100a;
      font-size:14px;
      font-weight:950;
      letter-spacing:.3px
    }

    .bz-primary:disabled{
      opacity:.5
    }

    .bzm-bottom{
      position:fixed;
      left:0;
      right:0;
      bottom:0;
      padding:
        12px 14px
        calc(12px + env(safe-area-inset-bottom));
      background:rgba(7,10,13,.96);
      border-top:1px solid #252e36;
      z-index:9999
    }

    .prize{
      font-size:27px;
      font-weight:950;
      margin:8px 0;
      color:#24e778
    }

    .stats{
      display:flex;
      gap:8px;
      margin-top:14px
    }

    .stats span{
      flex:1;
      background:#0a0e12;
      border-radius:12px;
      padding:10px;
      text-align:center
    }

    .stats b{
      display:block;
      font-size:16px
    }

    .stats small{
      display:block;
      color:#7f8995;
      font-size:9px;
      margin-top:3px
    }

    .bz-wallet{
      margin-top:14px;
      font-size:22px;
      font-weight:950
    }

    .ok{
      border-color:#1d6b42;
      color:#6ff0a5;
      text-align:center;
      font-weight:900
    }
  `;

  document.head.appendChild(style);

  intercept();

  window.BATZO_MASTER_FLOW={
    teamsPage,
    teamBuilder,
    contestPage,
    joinContest
  };

  console.log(
    'BATZO MASTER TEAM/JOIN FLOW READY'
  );

})();
