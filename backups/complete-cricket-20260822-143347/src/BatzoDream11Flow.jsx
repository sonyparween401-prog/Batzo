import React,{useState} from "react";

export default function BatzoDream11Flow({close}){
 const [screen,setScreen]=useState("contests");
 const [team,setTeam]=useState([]);
 const [captain,setCaptain]=useState(null);
 const [vice,setVice]=useState(null);

 const players=[
  ["Rohit Sharma","BAT","MI"],["Virat Kohli","BAT","RCB"],
  ["Shubman Gill","BAT","GT"],["Suryakumar Yadav","BAT","MI"],
  ["Rishabh Pant","WK","LSG"],["Sanju Samson","WK","RR"],
  ["Hardik Pandya","AR","MI"],["Ravindra Jadeja","AR","CSK"],
  ["Axar Patel","AR","DC"],["Jasprit Bumrah","BOWL","MI"],
  ["Mohammed Siraj","BOWL","GT"],["Kuldeep Yadav","BOWL","DC"]
 ];

 const toggle=i=>setTeam(x=>x.includes(i)?x.filter(v=>v!==i):x.length<11?[...x,i]:x);
 const ready=team.length===11 && captain!==null && vice!==null && captain!==vice;

 return <div style={{
  position:"fixed",inset:0,zIndex:999999,overflow:"auto",
  background:"linear-gradient(160deg,#06151c,#071d22 55%,#03090d)",
  color:"#fff",fontFamily:"Arial,sans-serif"
 }}>
 <style>{`
  .dh{position:sticky;top:0;z-index:5;background:#07151d;border-bottom:1px solid #29434d;padding:13px;display:flex;gap:12px;align-items:center}
  .back{background:#172b35;color:#fff;border:0;border-radius:12px;padding:10px 15px;font-size:20px}
  .brand{color:#27ef98;font-size:9px;letter-spacing:3px}.title{font-size:19px;font-weight:900}
  .db{padding:14px;max-width:650px;margin:auto}
  .card{background:linear-gradient(145deg,#10282f,#0a171e);border:1px solid #29434d;border-radius:18px;padding:15px;margin-bottom:11px}
  .green{color:#27ef98}.amount{font-size:28px;font-weight:1000}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:10px 0}
  .stat{background:#0b1a22;border:1px solid #273d46;border-radius:10px;padding:9px;text-align:center;color:#91a4ad;font-size:9px}.stat b{display:block;color:#fff;font-size:12px;margin-top:4px}
  .btn{width:100%;border:0;border-radius:14px;padding:15px;background:linear-gradient(90deg,#27ef98,#29dce8);color:#03120c;font-weight:1000}
  .btn:disabled{opacity:.4}.player{display:flex;align-items:center;gap:9px;background:#0d1c24;border:1px solid #293e47;border-radius:14px;padding:9px;margin:7px 0}
  .selected{border-color:#27ef98;background:#10352f}.avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#27ef98,#7857e8);font-weight:1000}
  .info{flex:1}.sub{display:block;color:#91a4ad;font-size:9px;margin-top:3px}
  .add{border:0;border-radius:9px;padding:8px 10px;background:#1a3039;color:#fff;font-weight:900}
  .cv{display:flex;gap:6px;margin-top:6px}.cv button{border:1px solid #536770;border-radius:8px;background:#172b35;color:#fff;padding:5px 12px;font-weight:1000}.cv .on{background:#7658e8}
  .rank{display:flex;justify-content:space-between;background:#0d1c24;border:1px solid #293e47;border-radius:11px;padding:12px;margin:7px 0}
 `}</style>

 <div className="dh">
  <button className="back" onClick={()=>screen==="contests"?close():setScreen(screen==="details"?"contests":screen==="team"?"details":screen==="mycontest"?"team":"contests")}>←</button>
  <div><div className="brand">BATZO</div><div className="title">
   {screen==="contests"?"Contests":screen==="details"?"Contest Details":screen==="team"?"Create My Team":screen==="mycontest"?"My Contest":"Leaderboard"}
  </div></div>
 </div>

 <div className="db">

 {screen==="contests" && <>
  {["Mega Contest","Small League","Head To Head"].map((name,i)=>
   <div className="card" key={name} onClick={()=>setScreen("details")}>
    <small>CRICKET CONTEST</small><h2>{name}</h2>
    <div className="green amount">{i===0?"₹1 Crore":i===1?"₹10 Lakh":"₹1,800"}</div>
    <div className="stats">
     <div className="stat">ENTRY<b>{i===0?"₹49":i===1?"₹99":"₹49"}</b></div>
     <div className="stat">SPOTS<b>{i===0?"5,00,000":i===1?"50,000":"2"}</b></div>
     <div className="stat">STATUS<b>OPEN</b></div>
    </div>
   </div>
  )}
 </>}

 {screen==="details" && <div className="card">
  <div className="green amount">₹1 Crore</div>
  <p>Mega Contest • Demo Contest</p>
  <div className="stats"><div className="stat">ENTRY<b>₹49</b></div><div className="stat">SPOTS<b>5,00,000</b></div><div className="stat">STATUS<b>OPEN</b></div></div>
  <button className="btn" onClick={()=>setScreen("team")}>CREATE MY TEAM</button>
 </div>}

 {screen==="team" && <>
  <div className="card"><div className="green amount">{team.length}/11</div><p>Choose 11 players, then select C and VC.</p></div>
  {players.map((p,i)=>{
   const sel=team.includes(i);
   return <div className={"player "+(sel?"selected":"")} key={i}>
    <div className="avatar">{p[0][0]}</div><div className="info"><b>{p[0]}</b><span className="sub">{p[1]} • {p[2]}</span>
    {sel&&<div className="cv">
     <button className={captain===i?"on":""} onClick={()=>{setCaptain(captain===i?null:i);if(vice===i)setVice(null)}}>C</button>
     <button className={vice===i?"on":""} onClick={()=>{setVice(vice===i?null:i);if(captain===i)setCaptain(null)}}>VC</button>
    </div>}</div>
    <button className="add" onClick={()=>toggle(i)}>{sel?"✓":"ADD"}</button>
   </div>
  })}
  <button className="btn" disabled={!ready} onClick={()=>setScreen("mycontest")}>{ready?"SAVE TEAM & JOIN":"SELECT 11 + C + VC"}</button>
 </>}

 {screen==="mycontest" && <div className="card">
  <h2>My Contest ✓</h2><p>Team 1 • Mega Contest</p>
  <div className="stats"><div className="stat">ENTRY<b>₹49</b></div><div className="stat">TEAM<b>TEAM 1</b></div><div className="stat">STATUS<b>JOINED</b></div></div>
  <button className="btn" onClick={()=>setScreen("leaderboard")}>VIEW LEADERBOARD</button>
 </div>}

 {screen==="leaderboard" && <div className="card">
  <h2>Leaderboard</h2>
  {[["1","YOU • TEAM 1","1000"],["2","BATZO PRO","975"],["3","CRICKET KING","950"],["4","CHAMPION XI","925"]].map(x=>
   <div className="rank" key={x[0]}><b>#{x[0]} {x[1]}</b><b className="green">{x[2]} pts</b></div>
  )}
  <button className="btn" onClick={close}>BACK TO HOME</button>
 </div>}

 </div></div>
}
