import React,{useState} from "react";

const players=[
["Rohit Sharma","BAT","MI"],["Virat Kohli","BAT","RCB"],["Shubman Gill","BAT","GT"],
["Suryakumar Yadav","BAT","MI"],["Yashasvi Jaiswal","BAT","RR"],["Rishabh Pant","WK","LSG"],
["Sanju Samson","WK","RR"],["Hardik Pandya","AR","MI"],["Ravindra Jadeja","AR","CSK"],
["Axar Patel","AR","DC"],["Jasprit Bumrah","BOWL","MI"],["Mohammed Siraj","BOWL","GT"],
["Kuldeep Yadav","BOWL","DC"],["Arshdeep Singh","BOWL","PBKS"],["Rashid Khan","BOWL","GT"],
["Trent Boult","BOWL","MI"]
];

const contests=[
["Mega Contest","₹1 Crore","₹49","5,00,000"],
["Small League","₹10 Lakh","₹99","50,000"],
["Head To Head","₹1,800","₹49","2"]
];

export default function BatzoMyTeamFlow({onClose}){
 const [screen,setScreen]=useState("contests");
 const [contest,setContest]=useState(contests[0]);
 const [selected,setSelected]=useState([]);
 const [captain,setCaptain]=useState(null);
 const [vice,setVice]=useState(null);

 const toggle=i=>{
  if(selected.includes(i)){
   setSelected(selected.filter(x=>x!==i));
   if(captain===i)setCaptain(null);
   if(vice===i)setVice(null);
  }else if(selected.length<11)setSelected([...selected,i]);
 };

 const valid=selected.length===11&&captain!==null&&vice!==null&&captain!==vice;

 const head=(title,sub)=>(
  <div className="mt-head">
   <button onClick={()=>{
    if(screen==="contests")onClose?.();
    else if(screen==="details")setScreen("contests");
    else if(screen==="team")setScreen("details");
    else if(screen==="mycontest")setScreen("contests");
    else if(screen==="leaderboard")setScreen("mycontest");
    else setScreen("leaderboard");
   }}>←</button>
   <div><b>BATZO</b><strong>{title}</strong><small>{sub}</small></div>
  </div>
 );

 const css=`.mt{min-height:100vh;background:linear-gradient(160deg,#061a17,#07121b 55%,#05080d);color:#fff;font-family:Arial;padding-bottom:25px}.mt *{box-sizing:border-box}.mt-head{height:72px;padding:10px 14px;display:flex;gap:12px;align-items:center;background:#08151d;position:sticky;top:0;z-index:10;border-bottom:1px solid #263b45}.mt-head button{width:44px;height:44px;border:0;border-radius:13px;background:#172832;color:#fff;font-size:23px}.mt-head b{display:block;color:#29ed98;font-size:9px;letter-spacing:3px}.mt-head strong{display:block;font-size:21px}.mt-head small{display:block;color:#8da0aa;font-size:10px;margin-top:3px}.mt-box{margin:14px;padding:17px;border-radius:20px;background:linear-gradient(145deg,#12242d,#0b151d);border:1px solid #293e49}.mt-box h2{margin:7px 0}.green{color:#28ee98}.mt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.mt-stat{background:#101e26;border:1px solid #273c46;border-radius:13px;text-align:center;padding:10px;font-size:9px;color:#91a3ad}.mt-stat b{display:block;color:#fff;font-size:13px;margin-top:5px}.mt-btn{width:100%;padding:16px;border:0;border-radius:15px;background:linear-gradient(90deg,#20e78d,#2bd8e8);font-weight:1000}.mt-btn:disabled{opacity:.4}.player{margin:8px 14px;padding:11px;border-radius:17px;background:#111f28;border:1px solid #293e49;display:flex;align-items:center;gap:10px}.player.on{background:#10372f;border-color:#28ee98}.ava{width:43px;height:43px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#20e990,#7659ed);font-weight:900}.pinfo{flex:1}.role{font-size:9px;color:#91a3ad;margin-top:3px}.cv{display:flex;gap:5px;margin-top:6px}.cv button{border:1px solid #51636c;background:#172731;color:#fff;border-radius:8px;padding:5px 10px;font-size:9px;font-weight:900}.cv .on{background:#8059e8}.rank{margin:8px 14px;padding:15px;border-radius:15px;background:#101e27;border:1px solid #293e49;display:flex;justify-content:space-between;font-size:11px}`;
 
 if(screen==="contests")return <div className="mt"><style>{css}</style>{head("Contests","Choose your contest")}{contests.map((x,i)=><div className="mt-box" key={i} onClick={()=>{setContest(x);setScreen("details")}}><small>CONTEST</small><h2>{x[0]}</h2><div className="green" style={{fontSize:27,fontWeight:900}}>{x[1]}</div><div className="mt-grid"><div className="mt-stat">ENTRY<b>{x[2]}</b></div><div className="mt-stat">SPOTS<b>{x[3]}</b></div><div className="mt-stat">STATUS<b>OPEN</b></div></div></div>)}</div>;

 if(screen==="details")return <div className="mt"><style>{css}</style>{head("Contest Details",contest[0])}<div className="mt-box"><div className="green" style={{fontSize:28,fontWeight:900}}>{contest[1]}</div><p>Prize Pool</p><div className="mt-grid"><div className="mt-stat">ENTRY<b>{contest[2]}</b></div><div className="mt-stat">SPOTS<b>{contest[3]}</b></div><div className="mt-stat">TEAMS<b>1</b></div></div></div><div className="mt-box"><h2>Create Your Team</h2><p>Select 11 players and choose C + VC.</p><button className="mt-btn" onClick={()=>setScreen("team")}>CREATE MY TEAM →</button></div></div>;

 if(screen==="team")return <div className="mt"><style>{css}</style>{head("My Team 1",`${selected.length}/11 Players`)}<div className="mt-box"><b>TEAM 1</b><p>Select players • C = Captain • VC = Vice-Captain</p></div>{players.map((p,i)=>{let on=selected.includes(i);return <div className={"player "+(on?"on":"")} key={i} onClick={()=>toggle(i)}><div className="ava">{p[0][0]}</div><div className="pinfo"><b>{p[0]}</b><div className="role">{p[1]} • {p[2]}</div>{on&&<div className="cv"><button className={captain===i?"on":""} onClick={e=>{e.stopPropagation();setCaptain(captain===i?null:i);if(vice===i)setVice(null)}}>C</button><button className={vice===i?"on":""} onClick={e=>{e.stopPropagation();setVice(vice===i?null:i);if(captain===i)setCaptain(null)}}>VC</button></div>}</div><b>{on?"✓":"+"}</b></div>})}<div className="mt-box"><button className="mt-btn" disabled={!valid} onClick={()=>setScreen("mycontest")}>{valid?"SAVE TEAM & JOIN CONTEST":"SELECT 11 + C + VC"}</button></div></div>;

 if(screen==="mycontest")return <div className="mt"><style>{css}</style>{head("My Contest","Team 1 • Joined")}<div className="mt-box"><h2>{contest[0]}</h2><p>Team 1</p><p>Captain: <b>{players[captain]?.[0]}</b></p><p>Vice-Captain: <b>{players[vice]?.[0]}</b></p><button className="mt-btn" onClick={()=>setScreen("leaderboard")}>VIEW LEADERBOARD →</button></div></div>;

 if(screen==="leaderboard")return <div className="mt"><style>{css}</style>{head("Leaderboard",contest[0])}{[["1","YOU • TEAM 1","1000"],["2","BATZO PRO","975"],["3","CRICKET KING","950"],["4","CHAMPION XI","925"],["5","PLAYER 842","900"]].map(x=><div className="rank" key={x[0]}><b>#{x[0]} {x[1]}</b><b className="green">{x[2]} pts</b></div>)}<div className="mt-box"><button className="mt-btn" onClick={()=>setScreen("result")}>RESULT PREVIEW →</button></div></div>;

 return <div className="mt"><style>{css}</style>{head("Result Preview","Team 1")}<div className="mt-box" style={{textAlign:"center"}}><div style={{fontSize:55}}>🏆</div><h2>Result Preview</h2><p>Your team is connected to the contest.</p><div className="mt-grid"><div className="mt-stat">RANK<b>#1</b></div><div className="mt-stat">POINTS<b>1000</b></div><div className="mt-stat">STATUS<b>READY</b></div></div></div></div>;
}
