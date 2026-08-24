import React,{useState} from "react";
import "./App.css";

const matches=[
 {id:1,team1:"IND",team2:"AUS",name1:"India",name2:"Australia",time:"7:30 PM",status:"UPCOMING",venue:"Wankhede Stadium"},
 {id:2,team1:"RCB",team2:"CSK",name1:"Royal Challengers",name2:"Chennai Super Kings",time:"3:30 PM",status:"LIVE",venue:"M. Chinnaswamy Stadium"},
 {id:3,team1:"MI",team2:"GT",name1:"Mumbai Indians",name2:"Gujarat Titans",time:"9:00 PM",status:"UPCOMING",venue:"Narendra Modi Stadium"}
];

function App(){
 const [page,setPage]=useState("home");
 const [match,setMatch]=useState(null);
 const [showTeam,setShowTeam]=useState(false);

 const openMatch=m=>{
  setMatch(m);
  setPage("details");
 };

 const goHome=()=>{
  setPage("home");
  setMatch(null);
  setShowTeam(false);
 };

 if(showTeam){
  return <BatzoMyTeamFlow onClose={()=>setShowTeam(false)}/>;
 }

 return (
  <div className="batzo-app">

   <header className="topbar">
    {page!=="home" ? (
     <button className="icon-btn" onClick={goHome}>←</button>
    ):<div className="batzo-mini">BATZO</div>}

    <div className="brand">
     <div className="brand-main">
      <span className="c1">B</span>
      <span className="c2">A</span>
      <span className="c3">T</span>
      <span className="c4">Z</span>
      <span className="c5">O</span>
     </div>
     <div className="brand-sub">CRICKET HUB</div>
    </div>

    <button className="wallet">₹ 0</button>
   </header>

   {page==="home" && (
    <>
     <section className="hero">
      <div className="hero-tag">🏏 BATZO CRICKET HUB</div>
      <h1>Play. Create.<br/><span>Conquer.</span></h1>
      <p>Build your perfect cricket team and compete.</p>
      <button className="primary" onClick={()=>setPage("matches")}>
       EXPLORE MATCHES →
      </button>
     </section>

     <section className="section">
      <div className="section-head">
       <h2>🔥 Featured Matches</h2>
       <button onClick={()=>setPage("matches")}>View All</button>
      </div>

      {matches.slice(0,2).map(m=>(
       <MatchCard key={m.id} match={m} onOpen={openMatch}/>
      ))}
     </section>

     <section className="quick">
      <button onClick={()=>setPage("matches")}>🏏<b>Matches</b><small>Play now</small></button>
      <button onClick={()=>setShowTeam(true)}>👕<b>My Team</b><small>Create team</small></button>
      <button onClick={()=>setShowTeam(true)}>🏆<b>Contests</b><small>Join contest</small></button>
     </section>
    </>
   )}

   {page==="matches" && (
    <section className="page">
     <div className="page-title">
      <span>LIVE & UPCOMING</span>
      <h1>Matches</h1>
     </div>

     {matches.map(m=>(
      <MatchCard key={m.id} match={m} onOpen={openMatch}/>
     ))}
    </section>
   )}

   {page==="details" && match && (
    <MatchDetails match={match} onContest={()=>setShowTeam(true)}/>
   )}

   <nav className="bottom">
    <button className={page==="home"?"active":""} onClick={goHome}>⌂<span>Home</span></button>
    <button className={page==="matches"?"active":""} onClick={()=>setPage("matches")}>🏏<span>Matches</span></button>
    <button onClick={()=>setShowTeam(true)}>🏆<span>Contests</span></button>
    <button onClick={()=>setShowTeam(true)}>👕<span>My Team</span></button>
   </nav>
  </div>
 );
}

function MatchCard({match,onOpen}){
 return (
  <button className="match-card" onClick={()=>onOpen(match)}>
   <div className="match-top">
    <span>{match.status==="LIVE"?"🔴 LIVE":"UPCOMING"}</span>
    <b>{match.time}</b>
   </div>

   <div className="teams">
    <div>
     <strong>{match.team1}</strong>
     <small>{match.name1}</small>
    </div>

    <div className="vs">VS</div>

    <div>
     <strong>{match.team2}</strong>
     <small>{match.name2}</small>
    </div>
   </div>

   <div className="match-bottom">
    <span>📍 {match.venue}</span>
    <b>VIEW MATCH →</b>
   </div>
  </button>
 );
}

function MatchDetails({match,onContest}){
 return (
  <section className="page">
   <div className="details-card">
    <div className="live">{match.status==="LIVE"?"🔴 LIVE":"🟢 UPCOMING"}</div>

    <h1>{match.team1} <span>VS</span> {match.team2}</h1>

    <p>{match.name1} vs {match.name2}</p>
    <p>🕒 {match.time}</p>
    <p>📍 {match.venue}</p>

    <div className="detail-actions">
     <button onClick={onContest}>🏆 JOIN CONTEST</button>
     <button onClick={onContest}>👕 CREATE MY TEAM</button>
    </div>
   </div>

   <div className="info-grid">
    <div><b>LIVE SCORE</b><span>Available</span></div>
    <div><b>CONTESTS</b><span>Open</span></div>
    <div><b>MY TEAM</b><span>Build 11</span></div>
    <div><b>MATCH INFO</b><span>View details</span></div>
   </div>
  </section>
 );
}

export default App;


/* BATZO_CONTEST_CVC */
function BatzoContestCVC({onClose}) {
  const [screen,setScreen]=React.useState("contests");
  const [selected,setSelected]=React.useState([]);
  const [captain,setCaptain]=React.useState(null);
  const [vice,setVice]=React.useState(null);
  const [joined,setJoined]=React.useState(false);

  const players=[
    ["Rohit Sharma","BAT","MI"],["Virat Kohli","BAT","RCB"],
    ["Shubman Gill","BAT","GT"],["Suryakumar Yadav","BAT","MI"],
    ["Rishabh Pant","WK","LSG"],["Sanju Samson","WK","RR"],
    ["Hardik Pandya","AR","MI"],["Ravindra Jadeja","AR","CSK"],
    ["Axar Patel","AR","DC"],["Jasprit Bumrah","BOWL","MI"],
    ["Mohammed Siraj","BOWL","GT"],["Kuldeep Yadav","BOWL","DC"],
    ["Arshdeep Singh","BOWL","PBKS"],["Rashid Khan","BOWL","GT"],
    ["Trent Boult","BOWL","MI"]
  ];

  const contests=[
    ["Mega Contest","₹1 Crore","₹49","5,00,000"],
    ["Small League","₹10 Lakh","₹99","50,000"],
    ["Head To Head","₹1,800","₹49","2"]
  ];

  const toggle=(i)=>{
    if(selected.includes(i)){
      setSelected(selected.filter(x=>x!==i));
      if(captain===i)setCaptain(null);
      if(vice===i)setVice(null);
    }else if(selected.length<11){
      setSelected([...selected,i]);
    }
  };

  const valid=selected.length===11 && captain!==null && vice!==null && captain!==vice;

  const back=()=>{
    if(screen==="contests") onClose();
    else if(screen==="details") setScreen("contests");
    else if(screen==="team") setScreen("details");
    else if(screen==="joined") setScreen("team");
    else onClose();
  };

  return React.createElement("div",{className:"batzo-cvc"},
    React.createElement("style",null,`
      .batzo-cvc{position:fixed;inset:0;z-index:99999;overflow:auto;background:radial-gradient(circle at 50% -10%,#163d38,#07121a 48%,#03070b);color:#fff;font-family:Arial,sans-serif;padding-bottom:30px}
      .cvc-head{height:70px;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#07131b;border-bottom:1px solid #263b45;position:sticky;top:0;z-index:5}
      .cvc-head button{width:42px;height:42px;border:0;border-radius:12px;background:#162832;color:#fff;font-size:22px}
      .cvc-head b{display:block;color:#28ed98;font-size:9px;letter-spacing:3px}.cvc-head strong{display:block;font-size:20px}
      .cvc-wrap{padding:14px}.cvc-card{background:linear-gradient(145deg,#12242c,#0a151d);border:1px solid #293e48;border-radius:20px;padding:16px;margin-bottom:11px}
      .cvc-card h2{margin:4px 0 10px}.cvc-green{color:#28ed98}.cvc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
      .cvc-stat{background:#101e26;border:1px solid #293c46;border-radius:12px;padding:10px;text-align:center;color:#8ea0aa;font-size:9px}.cvc-stat b{display:block;color:#fff;font-size:13px;margin-top:4px}
      .cvc-btn{width:100%;border:0;border-radius:14px;padding:15px;background:linear-gradient(90deg,#20e88e,#2ad9e7);color:#03110c;font-weight:1000}.cvc-btn:disabled{opacity:.4}
      .cvc-player{display:flex;align-items:center;gap:10px;margin:7px 0;padding:10px;border-radius:15px;background:#101e27;border:1px solid #293e48}.cvc-player.on{border-color:#28ed98;background:#10362f}
      .cvc-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#21ed95,#7959ec);font-weight:1000}.cvc-info{flex:1}.cvc-role{font-size:9px;color:#91a3ad;margin-top:3px}
      .cvc-cv{display:flex;gap:5px;margin-top:6px}.cvc-cv button{border:1px solid #50636d;border-radius:8px;background:#172832;color:#fff;padding:5px 11px;font-weight:900}.cvc-cv button.on{background:#805be8;border-color:#a184ff}
      .cvc-rank{display:flex;justify-content:space-between;padding:13px;margin:7px 0;background:#101e27;border:1px solid #293e48;border-radius:13px;font-size:11px}
    `),
    React.createElement("div",{className:"cvc-head"},
      React.createElement("button",{onClick:back},"←"),
      React.createElement("div",null,
        React.createElement("b",null,"BATZO"),
        React.createElement("strong",null,
          screen==="contests"?"Contests":screen==="details"?"Contest Details":screen==="team"?"My Team 1":"My Contest"
        )
      )
    ),
    React.createElement("div",{className:"cvc-wrap"},
      screen==="contests" && contests.map((c,i)=>
        React.createElement("div",{className:"cvc-card",key:i,onClick:()=>setScreen("details")},
          React.createElement("small",null,"CONTEST"),
          React.createElement("h2",null,c[0]),
          React.createElement("div",{className:"cvc-green",style:{fontSize:"28px",fontWeight:900}},c[1]),
          React.createElement("div",{className:"cvc-grid"},
            React.createElement("div",{className:"cvc-stat"},"ENTRY",React.createElement("b",null,c[2])),
            React.createElement("div",{className:"cvc-stat"},"SPOTS",React.createElement("b",null,c[3])),
            React.createElement("div",{className:"cvc-stat"},"STATUS",React.createElement("b",null,"OPEN"))
          )
        )
      ),

      screen==="details" && React.createElement("div",null,
        React.createElement("div",{className:"cvc-card"},
          React.createElement("div",{className:"cvc-green",style:{fontSize:"30px",fontWeight:900}},"₹1 Crore"),
          React.createElement("p",null,"Prize Pool"),
          React.createElement("div",{className:"cvc-grid"},
            React.createElement("div",{className:"cvc-stat"},"ENTRY",React.createElement("b",null,"₹49")),
            React.createElement("div",{className:"cvc-stat"},"SPOTS",React.createElement("b",null,"5,00,000")),
            React.createElement("div",{className:"cvc-stat"},"STATUS",React.createElement("b",null,"OPEN"))
          )
        ),
        React.createElement("div",{className:"cvc-card"},
          React.createElement("h2",null,"Create Your Team"),
          React.createElement("p",null,"Select 11 players and choose Captain + Vice-Captain."),
          React.createElement("button",{className:"cvc-btn",onClick:()=>setScreen("team")},"CREATE MY TEAM →")
        )
      ),

      screen==="team" && React.createElement("div",null,
        React.createElement("div",{className:"cvc-card"},
          React.createElement("h2",null,"My Team 1"),
          React.createElement("p",null,selected.length+"/11 players selected"),
          React.createElement("div",{className:"cvc-grid"},
            React.createElement("div",{className:"cvc-stat"},"CAPTAIN",React.createElement("b",null,captain!==null?players[captain][0].split(" ")[1]:"—")),
            React.createElement("div",{className:"cvc-stat"},"VICE CAPTAIN",React.createElement("b",null,vice!==null?players[vice][0].split(" ")[1]:"—")),
            React.createElement("div",{className:"cvc-stat"},"STATUS",React.createElement("b",null,valid?"READY":"INCOMPLETE"))
          )
        ),
        players.map((p,i)=>{
          const on=selected.includes(i);
          return React.createElement("div",{className:"cvc-player "+(on?"on":""),key:i,onClick:()=>toggle(i)},
            React.createElement("div",{className:"cvc-avatar"},p[0][0]),
            React.createElement("div",{className:"cvc-info"},
              React.createElement("b",null,p[0]),
              React.createElement("div",{className:"cvc-role"},p[1]+" • "+p[2]),
              on && React.createElement("div",{className:"cvc-cv"},
                React.createElement("button",{className:captain===i?"on":"",onClick:e=>{e.stopPropagation();setCaptain(captain===i?null:i);if(vice===i)setVice(null)}},"C"),
                React.createElement("button",{className:vice===i?"on":"",onClick:e=>{e.stopPropagation();setVice(vice===i?null:i);if(captain===i)setCaptain(null)}},"VC")
              )
            ),
            React.createElement("b",null,on?"✓":"+")
          );
        }),
        React.createElement("div",{className:"cvc-card"},
          React.createElement("button",{className:"cvc-btn",disabled:!valid,onClick:()=>setScreen("joined")},
            valid?"SAVE TEAM & JOIN CONTEST":"SELECT 11 + C + VC"
          )
        )
      ),

      screen==="joined" && React.createElement("div",null,
        React.createElement("div",{className:"cvc-card",style:{textAlign:"center"}},
          React.createElement("div",{style:{fontSize:"55px"}},"🏆"),
          React.createElement("h2",null,"Contest Joined"),
          React.createElement("p",null,"Team 1 successfully connected to the contest."),
          React.createElement("p",null,"Captain: "+players[captain][0]),
          React.createElement("p",null,"Vice-Captain: "+players[vice][0]),
          React.createElement("button",{className:"cvc-btn",onClick:onClose},"BACK TO HOME")
        ),
        React.createElement("div",{className:"cvc-card"},
          React.createElement("h2",null,"Leaderboard Preview"),
          [["1","YOU • TEAM 1","1000"],["2","BATZO PRO","975"],["3","CRICKET KING","950"],["4","CHAMPION XI","925"]].map(x=>
            React.createElement("div",{className:"cvc-rank",key:x[0]},
              React.createElement("b",null,"#"+x[0]+" "+x[1]),
              React.createElement("b",{className:"cvc-green"},x[2]+" pts")
            )
          )
        )
      )
    )
  );
}

window.__BATZO_OPEN_CONTEST_CVC=()=>{};
window.BatzoContestCVC=BatzoContestCVC;
