
(function(){
  "use strict";

  if(window.__BATZO_CONTINUE_FIX__) return;
  window.__BATZO_CONTINUE_FIX__=true;

  function findContinue(){
    const els=document.querySelectorAll(
      "button,[role='button'],a,.btn,.button,div"
    );

    for(const el of els){
      const t=(el.textContent||"").replace(/\s+/g," ").trim().toUpperCase();

      if(
        t.includes("CONTINUE") &&
        (
          t.includes("11/11") ||
          t.includes("11 / 11") ||
          t.includes("11")
        )
      ){
        return el;
      }
    }
    return null;
  }

  let locked=false;

  function activate(){
    const el=findContinue();
    if(!el) return;

    if(el.dataset.batzoContinueBound==="1") return;
    el.dataset.batzoContinueBound="1";

    const fire=function(ev){
      if(locked) return;

      const t=(el.textContent||"").replace(/\s+/g," ").trim().toUpperCase();
      if(!t.includes("CONTINUE")) return;

      locked=true;

      try{
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }catch(e){}

      setTimeout(function(){
        try{
          if(typeof el.onclick==="function"){
            el.onclick.call(el,new MouseEvent("click",{bubbles:true}));
          }
        }catch(e){}

        try{
          el.dispatchEvent(new MouseEvent("click",{
            bubbles:true,
            cancelable:true,
            view:window
          }));
        }catch(e){}

        setTimeout(function(){
          locked=false;
        },350);
      },30);
    };

    el.addEventListener("touchend",fire,{capture:true,passive:false});
    el.addEventListener("pointerup",fire,{capture:true,passive:false});
  }

  const observer=new MutationObserver(activate);

  function start(){
    activate();

    observer.observe(document.body,{
      childList:true,
      subtree:true,
      characterData:true
    });

    setInterval(activate,500);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
