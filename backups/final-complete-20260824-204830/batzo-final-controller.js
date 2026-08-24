(function(){
'use strict';

if(window.__BATZO_FINAL_CONTROLLER__) return;
window.__BATZO_FINAL_CONTROLLER__=true;

const TEAM_KEY='batzo_saved_teams';
const SELECTED_KEY='batzo_selected_team';
const JOINED_KEY='batzo_joined_contests';
const WALLET_KEY='batzo_wallet_balance';

const PLAYERS=[
{name:'Rohit Sharma',team:'IND',role:'BAT',credit:9.5},
{name:'Virat Kohli',team:'IND',role:'BAT',credit:9.5},
{name:'Shubman Gill',team:'IND',role:'BAT',credit:9},
{name:'KL Rahul',team:'IND',role:'WK',credit:9},
{name:'Rishabh Pant',team:'IND',role:'WK',credit:8.5},
{name:'Hardik Pandya',team:'IND',role:'AR',credit:9},
{name:'Ravindra Jadeja',team:'IND',role:'AR',credit:9},
{name:'Axar Patel',team:'IND',role:'AR',credit:8.5},
{name:'Jasprit Bumrah',team:'IND',role:'BOWL',credit:9.5},
{name:'Kuldeep Yadav',team:'IND',role:'BOWL',credit:8.5},
{name:'Mohammed Siraj',team:'IND',role:'BOWL',credit:8.5},
{name:'Arshdeep Singh',team:'IND',role:'BOWL',credit:8},
{name:'David Warner',team:'AUS',role:'BAT',credit:9},
{name:'Travis Head',team:'AUS',role:'BAT',credit:9.5},
{name:'Steve Smith',team:'AUS',role:'BAT',credit:8.5},
{name:'Josh Inglis',team:'AUS',role:'WK',credit:8},
{name:'Glenn Maxwell',team:'AUS',role:'AR',credit:9},
{name:'Marcus Stoinis',team:'AUS',role:'AR',credit:8.5},
{name:'Mitchell Marsh',team:'AUS',role:'AR',credit:8.5},
{name:'Pat Cummins',team:'AUS',role:'BOWL',credit:9},
{name:'Mitchell Starc',team:'AUS',role:'BOWL',credit:9},
{name:'Adam Zampa',team:'AUS',role:'BOWL',credit:8.5},
{name:'Josh Hazlewood',team:'AUS',role:'BOWL',credit:8.5},
{name:'Nathan Ellis',team:'AUS',role:'BOWL',credit:7.5}
];

const CONTEST={
id:'batzo-mega-contest',
name:'Mega Contest',
prize:'₹50 Lakhs',
entry:49,
spots:'2.1L'
};

function read(k,d){
try{
const v=localStorage.getItem(k);
return v===null?d:JSON.parse(v);
}catch(e){return d;}
}

function write(k,v){
try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}
}

function esc(v){
return String(v==null?'':v).replace(/[&<>"']/g,function(c){
return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
});
}

function teams(){
const a=read(TEAM_KEY,[]);
return Array.isArray(a)?a:[];
}

function selected(){
return read(SELECTED_KEY,null);
}

function wallet(){
const n=Number(localStorage.getItem(WALLET_KEY)||0);
return Number.isFinite(n)&&n>=0?n:0;
}

let overlay=null;
let screenStack=[];

function makeOverlay(){
if(overlay) return overlay;

overlay=document.createElement('div');
overlay.id='batzoFinalOverlay';

overlay.style.cssText=
'position:fixed;inset:0;z-index:2147483000;'+
'background:#070a0d;color:#fff;overflow:auto;'+
'font-family:system-ui,-apple-system,Segoe UI,sans-serif;'+
'box-sizing:border-box;';

document.body.appendChild(overlay);
return overlay;
}

function closeOverlay(){
if(overlay){
overlay.remove();
overlay=null;
}
screenStack=[];
window.__BATZO_CONTEST_LOCKED__=false;
}

function back(){
if(screenStack.length>1){
screenStack.pop();
screenStack[screenStack.length-1]();
}else{
closeOverlay();
}
}

function page(title,subtitle,body,footer){
const o=makeOverlay();

o.innerHTML=
'<div style="min-height:100%;box-sizing:border-box;padding:18px 14px 110px">'+
'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px">'+
'<div>'+
'<div style="font-size:11px;font-weight:900;letter-spacing:2px;color:#24e778">BATZO CRICKET</div>'+
'<h1 style="margin:5px 0;font-size:27px">'+esc(title)+'</h1>'+
'<div style="font-size:12px;color:#8f97a5">'+esc(subtitle||'')+'</div>'+
'</div>'+
'<button id="bzFinalBack" style="border:0;border-radius:12px;padding:10px 13px;background:#20272e;color:#fff;font-weight:900">BACK</button>'+
'</div>'+
'<div id="bzFinalBody">'+body+'</div>'+
'<div style="position:fixed;left:0;right:0;bottom:0;padding:12px 14px;background:rgba(7,10,13,.97);border-top:1px solid #252e36;box-sizing:border-box">'+
(footer||'')+
'</div>'+
'</div>';

document.getElementById('bzFinalBack').onclick=function(e){
e.preventDefault();
e.stopPropagation();
back();
};
}

function push(fn){
screenStack.push(fn);
fn();
}

function start(fn){
screenStack=[];
push(fn);
}

function createTeam(editIndex){
let old=editIndex==null?null:teams()[editIndex];
let selectedSet=new Set();

if(old&&Array.isArray(old.players)){
old.players.forEach(function(p){
const name=typeof p==='string'?p:p&&p.name;
const i=PLAYERS.findIndex(x=>x.name===name);
if(i>=0) selectedSet.add(i);
});
}

function render(){
let rows=PLAYERS.map(function(p,i){
const on=selectedSet.has(i);
return '<button type="button" data-player="'+i+'" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:7px 0;padding:12px;border-radius:13px;border:1px solid '+(on?'#24e778':'#252e36')+';background:'+(on?'#102419':'#11171c')+';color:#fff;text-align:left">'+
'<span><b>'+esc(p.name)+'</b><small style="display:block;color:#8f97a5;margin-top:3px">'+esc(p.team)+' • '+esc(p.role)+' • '+p.credit+' Cr</small></span>'+
'<strong style="padding:8px 10px;border-radius:9px;background:'+(on?'#24e778':'#20282f')+';color:'+(on?'#06100a':'#fff')+'">'+(on?'✓':'ADD')+'</strong>'+
'</button>';
}).join('');

page(
editIndex==null?'Create Team':'Edit Team',
'Select exactly 11 players',
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:15px;margin-bottom:10px">'+
'<div style="font-size:11px;color:#8f97a5;font-weight:900">SELECTED PLAYERS</div>'+
'<div id="bzFinalCount" style="font-size:27px;font-weight:950;margin-top:5px">'+selectedSet.size+'/11</div>'+
'</div>'+
rows,
'<button id="bzFinalContinue" style="width:100%;border:0;border-radius:15px;padding:15px;background:#24e778;color:#06100a;font-weight:950">CONTINUE • '+selectedSet.size+'/11</button>'
);

document.querySelectorAll('[data-player]').forEach(function(btn){
btn.onclick=function(e){
e.preventDefault();
e.stopPropagation();
const i=Number(btn.dataset.player);

if(selectedSet.has(i)) selectedSet.delete(i);
else{
if(selectedSet.size>=11){
alert('Maximum 11 players allowed.');
return;
}
selectedSet.add(i);
}
render();
};
});

document.getElementById('bzFinalContinue').onclick=function(e){
e.preventDefault();
e.stopPropagation();

if(selectedSet.size!==11){
alert('Please select exactly 11 players.');
return;
}

const indexes=Array.from(selectedSet);
push(function(){captainStep(editIndex,indexes);});
};
}

function captainStep(editIndex,indexes){
let captain=null;
let viceCaptain=null;
const old=editIndex==null?null:teams()[editIndex];

if(old&&Array.isArray(old.players)){
const cn=old.players[old.captain]?.name||old.players[old.captain];
const vn=old.players[old.viceCaptain]?.name||old.players[old.viceCaptain];
const ci=PLAYERS.findIndex(x=>x.name===cn);
const vi=PLAYERS.findIndex(x=>x.name===vn);
if(indexes.includes(ci)) captain=ci;
if(indexes.includes(vi)) viceCaptain=vi;
}

const render=function(){
const rows=indexes.map(function(i){
const p=PLAYERS[i];
return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#11171c;border:1px solid #252e36;border-radius:13px;padding:12px;margin:7px 0">'+
'<span><b>'+esc(p.name)+'</b><small style="display:block;color:#8f97a5;margin-top:3px">'+esc(p.team)+' • '+esc(p.role)+'</small></span>'+
'<span style="display:flex;gap:6px">'+
'<button data-c="'+i+'" style="border:0;border-radius:9px;padding:10px;background:'+(captain===i?'#24e778':'#20282f')+';color:'+(captain===i?'#06100a':'#fff');+';font-weight:900">C</button>'+
'<button data-vc="'+i+'" style="border:0;border-radius:9px;padding:10px;background:'+(viceCaptain===i?'#24e778':'#20282f')+';color:'+(viceCaptain===i?'#06100a':'#fff');+';font-weight:900">VC</button>'+
'</span></div>';
}).join('');

page(
'Captain & Vice-Captain',
'Choose one Captain and one different Vice-Captain',
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:15px;margin-bottom:10px"><b>'+indexes.length+'/11 PLAYERS</b></div>'+rows,
'<button id="bzFinalConfirm" style="width:100%;border:0;border-radius:15px;padding:15px;background:#24e778;color:#06100a;font-weight:950">CONFIRM TEAM</button>'
);

document.querySelectorAll('[data-c]').forEach(function(btn){
btn.onclick=function(e){
e.preventDefault();
e.stopPropagation();
captain=Number(btn.dataset.c);
render();
};
});

document.querySelectorAll('[data-vc]').forEach(function(btn){
btn.onclick=function(e){
e.preventDefault();
e.stopPropagation();
viceCaptain=Number(btn.dataset.vc);
render();
};
});

document.getElementById('bzFinalConfirm').onclick=function(e){
e.preventDefault();
e.stopPropagation();

if(captain===null){alert('Select Captain first.');return;}
if(viceCaptain===null){alert('Select Vice-Captain first.');return;}
if(captain===viceCaptain){alert('Captain and Vice-Captain must be different.');return;}

const a=teams();
const team={
id:old&&old.id?old.id:'team-'+Date.now(),
players:indexes.map(i=>PLAYERS[i]),
captain:indexes.indexOf(captain),
viceCaptain:indexes.indexOf(viceCaptain),
createdAt:old&&old.createdAt?old.createdAt:Date.now(),
updatedAt:Date.now()
};

if(editIndex==null)a.unshift(team);
else a[editIndex]=team;

write(TEAM_KEY,a);
write(SELECTED_KEY,team);
window.BATZO_SELECTED_TEAM=team;

alert('TEAM CONFIRMED');
push(function(){teamsPage();});
};
};

render();
}

function teamsPage(){
const list=teams();

let body=
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:15px;margin-bottom:10px">'+
'<div style="font-size:11px;color:#8f97a5;font-weight:900">MY TEAMS</div>'+
'<div style="font-size:27px;font-weight:950;margin-top:5px">'+list.length+' TEAM'+(list.length===1?'':'S')+'</div>'+
'<div style="font-size:13px;color:#9aa3ae;margin-top:6px">Every team must contain exactly 11 players.</div>'+
'</div>';

if(!list.length){
body+='<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:25px;text-align:center;color:#9aa3ae">No saved teams yet.<br><br>Create your first team below.</div>';
}else{
list.forEach(function(t,i){
body+='<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:14px;margin:10px 0">'+
'<b style="color:#24e778">TEAM '+(i+1)+'</b>'+
'<div style="font-size:12px;color:#9aa3ae;margin-top:5px">'+(t.players||[]).length+'/11 PLAYERS</div>'+
'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">'+
(t.players||[]).map(function(p,j){
return '<span style="padding:7px;border-radius:8px;background:#0b0f13;font-size:11px">'+esc(p.name||p)+(j===t.captain?' (C)':'')+(j===t.viceCaptain?' (VC)':'')+'</span>';
}).join('')+
'</div>'+
'<div style="display:flex;gap:8px;margin-top:12px">'+
'<button data-edit-team="'+i+'" style="flex:1;border:0;border-radius:10px;padding:11px;background:#183b2b;color:#72f0aa;font-weight:900">EDIT TEAM</button>'+
'<button data-delete-team="'+i+'" style="border:0;border-radius:10px;padding:11px;background:#401d21;color:#ff8c96;font-weight:900">DELETE</button>'+
'<button data-select-team="'+i+'" style="border:0;border-radius:10px;padding:11px;background:#20282f;color:#fff;font-weight:900">SELECT</button>'+
'</div></div>';
});
}

page(
'My Teams',
'Create, edit, delete or select your fantasy team',
body,
'<button id="bzFinalCreate" style="width:100%;border:0;border-radius:15px;padding:15px;background:#24e778;color:#06100a;font-weight:950">CREATE TEAM →</button>'
);

document.getElementById('bzFinalCreate').onclick=function(){
push(function(){createTeam(null);});
};

document.querySelectorAll('[data-edit-team]').forEach(function(b){
b.onclick=function(){push(function(){createTeam(Number(b.dataset.editTeam));});};
});

document.querySelectorAll('[data-delete-team]').forEach(function(b){
b.onclick=function(){
const i=Number(b.dataset.deleteTeam);
const a=teams();
a.splice(i,1);
write(TEAM_KEY,a);
if(selected()&&!a.some(x=>x.id===selected().id))localStorage.removeItem(SELECTED_KEY);
teamsPage();
};
});

document.querySelectorAll('[data-select-team]').forEach(function(b){
b.onclick=function(){
const i=Number(b.dataset.selectTeam);
const a=teams();
if(!a[i])return;
write(SELECTED_KEY,a[i]);
alert('TEAM SELECTED');
teamsPage();
};
});
}

function contestPage(){
const team=selected();

let teamBlock=team?
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:15px;margin:10px 0">'+
'<b style="color:#24e778">SELECTED TEAM</b>'+
'<div style="margin-top:7px">'+(team.players||[]).length+'/11 PLAYERS</div>'+
'<div style="font-size:12px;color:#9aa3ae;margin-top:5px">'+
esc((team.players||[]).map(p=>p.name||p).slice(0,4).join(', '))+
((team.players||[]).length>4?' ...':'')+
'</div></div>':
'<div style="background:#3b2412;border:1px solid #6b431e;border-radius:16px;padding:15px;margin:10px 0;color:#ffd58a">No team selected. Select or create a team first.</div>';

page(
CONTEST.name,
'Select a team and join the contest',
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:16px">'+
'<div style="font-size:11px;color:#8f97a5;font-weight:900">WINNING PRIZE</div>'+
'<div style="font-size:28px;font-weight:950;color:#24e778;margin-top:5px">'+CONTEST.prize+'</div>'+
'<div style="display:flex;gap:8px;margin-top:12px">'+
'<div style="flex:1;text-align:center;background:#0a0e12;padding:10px;border-radius:10px"><b>₹'+CONTEST.entry+'</b><small style="display:block;color:#8f97a5">ENTRY</small></div>'+
'<div style="flex:1;text-align:center;background:#0a0e12;padding:10px;border-radius:10px"><b>'+CONTEST.spots+'</b><small style="display:block;color:#8f97a5">SPOTS</small></div>'+
'</div></div>'+
teamBlock+
'<div style="background:#11171c;border:1px solid #252e36;border-radius:16px;padding:15px;margin-top:10px">Wallet: <b>₹'+wallet().toFixed(2)+'</b></div>',
'<div style="display:flex;gap:8px"><button id="bzSelectTeam" style="flex:1;border:0;border-radius:13px;padding:14px;background:#20282f;color:#fff;font-weight:900">SELECT TEAM</button><button id="bzJoinContest" style="flex:1;border:0;border-radius:13px;padding:14px;background:#24e778;color:#06100a;font-weight:950">JOIN CONTEST • ₹49</button></div>'
);

document.getElementById('bzSelectTeam').onclick=function(){
push(function(){teamsPage();});
};

document.getElementById('bzJoinContest').onclick=function(){
const t=selected();

if(!t||!Array.isArray(t.players)||t.players.length!==11){
alert('SELECT TEAM: create/confirm an 11-player team first.');
return;
}

const joined=read(JOINED_KEY,[]);
if(Array.isArray(joined)&&joined.some(x=>String(x.contestId)===CONTEST.id&&String(x.teamId)===String(t.id))){
alert('This team is already joined.');
return;
}

const bal=wallet();

if(bal<CONTEST.entry){
alert('Insufficient wallet balance. Required ₹49.');
return;
}

localStorage.setItem(WALLET_KEY,String((bal-CONTEST.entry).toFixed(2)));

const a=Array.isArray(joined)?joined:[];
a.unshift({
contestId:CONTEST.id,
teamId:t.id,
team:t,
entry:CONTEST.entry,
joinedAt:Date.now(),
status:'JOINED'
});
write(JOINED_KEY,a);

alert('CONTEST JOINED • ₹49 deducted');
contestPage();
};
}

function openTeams(){
start(function(){teamsPage();});
}

function openContest(){
start(function(){contestPage();});
}

function handleRootClick(e){
const el=e.target&&e.target.closest?e.target.closest('button,a,[role="button"]'):null;
if(!el)return;

const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();

if(
text.includes('CREATE TEAM')||
text.includes('BUILD YOUR XI')
){
e.preventDefault();
e.stopPropagation();
openTeams();
setTimeout(function(){createTeam(null);},20);
return;
}

if(
text==='MY TEAMS'||
text.includes('MY TEAMS')
){
e.preventDefault();
e.stopPropagation();
openTeams();
return;
}

if(
text.includes('VIEW CONTEST')||
text==='CONTESTS'||
text.includes('JOIN CONTEST')||
text==='JOIN NOW'
){
e.preventDefault();
e.stopPropagation();

if(text.includes('JOIN CONTEST')||text==='JOIN NOW'){
openContest();
}else{
openContest();
}
return;
}
}

function install(){
const root=document.getElementById('root');
if(!root)return;

root.addEventListener('click',handleRootClick,true);

document.addEventListener('backbutton',function(e){
if(overlay){
try{e.preventDefault();}catch(x){}
back();
}
},false);

window.addEventListener('popstate',function(){
if(overlay)back();
},false);

console.log('BATZO FINAL SINGLE CONTROLLER READY');
}

if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',install,{once:true});
}else{
install();
}

})();
