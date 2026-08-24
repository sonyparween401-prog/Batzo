export const BATZO_PLAYERS = [
  { id: 1, name: "Rohit Sharma", role: "BAT", team: "MT" },
  { id: 2, name: "Virat Kohli", role: "BAT", team: "DK" },
  { id: 3, name: "Jasprit Bumrah", role: "BOWL", team: "MT" },
  { id: 4, name: "Hardik Pandya", role: "AR", team: "MT" },
  { id: 5, name: "KL Rahul", role: "WK", team: "DK" },
  { id: 6, name: "Travis Head", role: "BAT", team: "DK" },
  { id: 7, name: "Pat Cummins", role: "BOWL", team: "DK" },
  { id: 8, name: "Rishabh Pant", role: "WK", team: "MT" },
  { id: 9, name: "Shubman Gill", role: "BAT", team: "MT" },
  { id: 10, name: "Suryakumar Yadav", role: "BAT", team: "MT" },
  { id: 11, name: "Yashasvi Jaiswal", role: "BAT", team: "MT" },
  { id: 12, name: "Ravindra Jadeja", role: "AR", team: "MT" },
  { id: 13, name: "Axar Patel", role: "AR", team: "MT" },
  { id: 14, name: "Kuldeep Yadav", role: "BOWL", team: "MT" },
  { id: 15, name: "Mohammed Siraj", role: "BOWL", team: "MT" },
  { id: 16, name: "Arshdeep Singh", role: "BOWL", team: "MT" },
  { id: 17, name: "Mitchell Marsh", role: "AR", team: "DK" },
  { id: 18, name: "Glenn Maxwell", role: "AR", team: "DK" },
  { id: 19, name: "Steve Smith", role: "BAT", team: "DK" },
  { id: 20, name: "David Warner", role: "BAT", team: "DK" },
  { id: 21, name: "Josh Inglis", role: "WK", team: "DK" },
  { id: 22, name: "Mitchell Starc", role: "BOWL", team: "DK" },
  { id: 23, name: "Josh Hazlewood", role: "BOWL", team: "DK" },
  { id: 24, name: "Adam Zampa", role: "BOWL", team: "DK" }
];

export const BATZO_CONTESTS = [
  {name:"Mega Contest",prize:"₹50 Lakhs",entry:"₹49",spots:"2.1L",joined:"1.84L"},
  {name:"Head To Head",prize:"₹1,800",entry:"₹49",spots:"2",joined:"1"},
  {name:"Small Contest",prize:"₹25,000",entry:"₹99",spots:"1,000",joined:"642"}
];

export function openBatzoTeam(match="IND vs AUS") {
  window.dispatchEvent(new CustomEvent("batzo:team",{detail:{match}}));
}

export function openBatzoContest(contest=BATZO_CONTESTS[0]) {
  window.dispatchEvent(new CustomEvent("batzo:contest",{detail:{contest}}));
}


/* BATZO_CONTINUE_11_CVC_MASTER_V1 */
(function BATZO_CONTINUE_11_CVC_MASTER(){
  if (typeof window === "undefined") return;
  if (window.__BATZO_CONTINUE_11_CVC_MASTER__) return;
  window.__BATZO_CONTINUE_11_CVC_MASTER__ = true;

  function textOf(el){
    return ((el && (el.innerText || el.textContent)) || "")
      .replace(/\s+/g," ")
      .trim()
      .toUpperCase();
  }

  function isContinue(el){
    if (!el) return false;
    var t = textOf(el);
    return (
      t.indexOf("CONTINUE") >= 0 &&
      (
        t.indexOf("11/11") >= 0 ||
        t.indexOf("11 / 11") >= 0 ||
        t.indexOf("11") >= 0
      )
    );
  }

  function findContinue(target){
    var el = target;
    for(var i=0;i<6 && el;i++,el=el.parentElement){
      if(isContinue(el)) return el;
    }

    var all = document.querySelectorAll("button,[role='button'],a,div");
    for(var j=0;j<all.length;j++){
      if(isContinue(all[j])) return all[j];
    }
    return null;
  }

  function selectedCount(){
    var selectors = [
      "[data-selected='true']",
      ".selected",
      ".player-selected",
      ".is-selected",
      ".active"
    ];

    var n = 0;
    for(var i=0;i<selectors.length;i++){
      try { n = Math.max(n, document.querySelectorAll(selectors[i]).length); }
      catch(e){}
    }

    var body = textOf(document.body);
    var m = body.match(/(?:CONTINUE|SELECTED)[^0-9]{0,20}(11)\s*\/\s*11/);
    if(m) n = 11;

    return n;
  }

  function openCVC(){
    var candidates = [
      "button[data-action='captain']",
      "button[data-action='continue']",
      "[data-batzo='captain']",
      "[data-batzo='cvc']",
      "#continue-team",
      "#continueTeam"
    ];

    for(var i=0;i<candidates.length;i++){
      var x = document.querySelector(candidates[i]);
      if(x && textOf(x).indexOf("CONTINUE") < 0){
        try { x.click(); return true; } catch(e){}
      }
    }

    var all = document.querySelectorAll("button,[role='button'],a");
    for(var j=0;j<all.length;j++){
      var t = textOf(all[j]);
      if(
        t.indexOf("CAPTAIN") >= 0 ||
        t.indexOf("VICE-CAPTAIN") >= 0 ||
        t.indexOf("C / VC") >= 0 ||
        t.indexOf("C/VC") >= 0
      ){
        try { all[j].click(); return true; } catch(e){}
      }
    }

    return false;
  }

  function handleContinue(ev){
    var btn = findContinue(ev.target);
    if(!btn) return;

    var n = selectedCount();
    if(n < 11) return;

    ev.preventDefault();
    ev.stopPropagation();

    if(typeof ev.stopImmediatePropagation === "function"){
      ev.stopImmediatePropagation();
    }

    btn.setAttribute("data-batzo-continue","handled");

    setTimeout(function(){
      if(!openCVC()){
        window.dispatchEvent(new CustomEvent("batzo:continue-team",{
          detail:{selected:11, stage:"captain-vc"}
        }));
      }
    },30);
  }

  document.addEventListener("pointerup",handleContinue,true);
  document.addEventListener("touchend",handleContinue,true);
  document.addEventListener("click",handleContinue,true);

  window.addEventListener("batzo:continue-team",function(){
    setTimeout(function(){
      var body = textOf(document.body);
      if(
        body.indexOf("CAPTAIN") < 0 &&
        body.indexOf("VICE-CAPTAIN") < 0
      ){
        var all = document.querySelectorAll("button,[role='button'],a");
        for(var i=0;i<all.length;i++){
          var t=textOf(all[i]);
          if(t.indexOf("CAPTAIN")>=0 || t.indexOf("C/VC")>=0){
            try{ all[i].click(); return; }catch(e){}
          }
        }
      }
    },50);
  });
})();

