import React,{useState} from "react";
import BatzoMyTeamFlow from "./BatzoMyTeamFlow.jsx";
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
