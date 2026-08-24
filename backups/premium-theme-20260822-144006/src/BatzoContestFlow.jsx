import React,{useState} from "react";

export default function BatzoContestFlow({onClose}) {
  const [page,setPage]=useState("contests");
  const [selected,setSelected]=useState([]);
  const [captain,setCaptain]=useState(null);
  const [vice,setVice]=useState(null);
  const [joined,setJoined]=useState(false);

  const players=[
    ["Rohit Sharma","BAT","MI"],["Virat Kohli","BAT","RCB"],
    ["Shubman Gill","BAT","GT"],["Suryakumar Yadav","BAT","MI"],
    ["Rishabh Pant","WK","LSG"],["Sanju Samson","WK","RR"],
    ["Hardik Pandya","AR","MI"],["Ravindra Jadeja","AR","CSK"],
    ["Axar Patel","AR","DC"],["Jasprit Bumrah","BOWL","MI"],
    ["Mohammed Siraj","BOWL","GT"],["Kuldeep Yadav","BOWL","DC"]
  ];

  const toggle=i=>{
    setSelected(old=>{
      if(old.includes(i)) return old.filter(x=>x!==i);
      return old.length<11 ? [...old,i] : old;
    });
  };

  const ready=selected.length===11 &&
    captain!==null && vice!==null && captain!==vice;

  const goBack=()=>{
    if(page==="contests") onClose();
    else if(page==="details") setPage("contests");
    else if(page==="team") setPage("details");
    else if(page==="mycontest") setPage("team");
    else setPage("mycontest");
  };

  return React.createElement(
    "div",
    {className:"batzo-contest-overlay"},
    React.createElement("style",null,`
      .batzo-contest-overlay{
        position:fixed;inset:0;z-index:999999;overflow:auto;
        background:linear-gradient(160deg,#06151c,#08272a 55%,#03090d);
        color:#fff;font-family:Arial,sans-serif
      }
      .bc-head{
        position:sticky;top:0;z-index:5;height:66px;
        display:flex;align-items:center;gap:12px;padding:10px 14px;
        background:#07151d;border-bottom:1px solid #29434d
      }
      .bc-back{
        width:42px;height:42px;border:0;border-radius:12px;
        background:#172c36;color:#fff;font-size:22px
      }
      .bc-brand{color:#28ef98;font-size:9px;letter-spacing:3px}
      .bc-title{font-size:19px;font-weight:900}
      .bc-body{padding:14px;max-width:650px;margin:auto}
      .bc-card{
        background:linear-gradient(145deg,#10282f,#0a171e);
        border:1px solid #29434d;border-radius:18px;
        padding:15px;margin-bottom:11px
      }
      .bc-green{color:#28ef98}
      .bc-big{font-size:28px;font-weight:1000}
      .bc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:10px 0}
      .bc-stat{
        background:#0b1a22;border:1px solid #273d46;
        border-radius:10px;padding:9px;text-align:center;
        color:#91a4ad;font-size:9px
      }
      .bc-stat b{display:block;color:#fff;font-size:12px;margin-top:4px}
      .bc-btn{
        width:100%;border:0;border-radius:14px;padding:15px;
        background:linear-gradient(90deg,#28ef98,#29dce8);
        color:#03120c;font-weight:1000
      }
      .bc-btn:disabled{opacity:.4}
      .bc-player{
        display:flex;align-items:center;gap:9px;
        background:#0d1c24;border:1px solid #293e47;
        border-radius:14px;padding:9px;margin:7px 0
      }
      .bc-player.selected{
        border-color:#28ef98;background:#10352f
      }
      .bc-avatar{
        width:42px;height:42px;border-radius:50%;
        display:grid;place-items:center;
        background:linear-gradient(135deg,#28ef98,#7857e8);
        font-weight:1000
      }
      .bc-info{flex:1}
      .bc-sub{display:block;color:#91a4ad;font-size:9px;margin-top:3px}
      .bc-add{
        border:0;border-radius:9px;padding:8px 10px;
        background:#1a3039;color:#fff;font-weight:900
      }
      .bc-cv{display:flex;gap:6px;margin-top:6px}
      .bc-cv button{
        border:1px solid #536770;border-radius:8px;
        background:#172b35;color:#fff;padding:5px 12px;font-weight:1000
      }
      .bc-cv .active{background:#7658e8;border-color:#a98dff}
      .bc-rank{
        display:flex;justify-content:space-between;
        background:#0d1c24;border:1px solid #293e47;
        border-radius:11px;padding:12px;margin:7px 0
      }
    `),

    React.createElement("div",{className:"bc-head"},
      React.createElement("button",{className:"bc-back",onClick:goBack},"←"),
      React.createElement("div",null,
        React.createElement("div",{className:"bc-brand"},"BATZO"),
        React.createElement("div",{className:"bc-title"},
          page==="contests"?"Contests":
          page==="details"?"Contest Details":
          page==="team"?"Create My Team":
          page==="mycontest"?"My Contest":"Leaderboard"
        )
      )
    ),

    React.createElement("div",{className:"bc-body"},

      page==="contests" && ["Mega Contest","Small League","Head To Head"].map((name,i)=>
        React.createElement("div",{
          className:"bc-card",key:name,
          onClick:()=>setPage("details")
        },
          React.createElement("small",null,"CRICKET CONTEST"),
          React.createElement("h2",null,name),
          React.createElement("div",{className:"bc-green bc-big"},
            i===0?"₹1 Crore":i===1?"₹10 Lakh":"₹1,800"
          ),
          React.createElement("div",{className:"bc-stats"},
            React.createElement("div",{className:"bc-stat"},"ENTRY",
              React.createElement("b",null,i===0?"₹49":i===1?"₹99":"₹49")),
            React.createElement("div",{className:"bc-stat"},"SPOTS",
              React.createElement("b",null,i===0?"5,00,000":i===1?"50,000":"2")),
            React.createElement("div",{className:"bc-stat"},"STATUS",
              React.createElement("b",null,"OPEN"))
          )
        )
      ),

      page==="details" && React.createElement("div",{className:"bc-card"},
        React.createElement("div",{className:"bc-green bc-big"},"₹1 Crore"),
        React.createElement("p",null,"Mega Contest • Demo Contest"),
        React.createElement("div",{className:"bc-stats"},
          React.createElement("div",{className:"bc-stat"},"ENTRY",
            React.createElement("b",null,"₹49")),
          React.createElement("div",{className:"bc-stat"},"SPOTS",
            React.createElement("b",null,"5,00,000")),
          React.createElement("div",{className:"bc-stat"},"STATUS",
            React.createElement("b",null,"OPEN"))
        ),
        React.createElement("button",{
          className:"bc-btn",
          onClick:()=>setPage("team")
        },"CREATE MY TEAM")
      ),

      page==="team" && React.createElement("div",null,
        React.createElement("div",{className:"bc-card"},
          React.createElement("div",{className:"bc-green bc-big"},
            selected.length+"/11"),
          React.createElement("p",null,
            "Select 11 players, then choose C and VC.")
        ),

        players.map((p,i)=>{
          const isSelected=selected.includes(i);
          return React.createElement("div",{
            className:"bc-player "+(isSelected?"selected":""),
            key:i
          },
            React.createElement("div",{className:"bc-avatar"},p[0][0]),
            React.createElement("div",{className:"bc-info"},
              React.createElement("b",null,p[0]),
              React.createElement("span",{className:"bc-sub"},
                p[1]+" • "+p[2]),
              isSelected && React.createElement("div",{className:"bc-cv"},
                React.createElement("button",{
                  className:captain===i?"active":"",
                  onClick:()=>{
                    setCaptain(captain===i?null:i);
                    if(vice===i)setVice(null);
                  }
                },"C"),
                React.createElement("button",{
                  className:vice===i?"active":"",
                  onClick:()=>{
                    setVice(vice===i?null:i);
                    if(captain===i)setCaptain(null);
                  }
                },"VC")
              )
            ),
            React.createElement("button",{
              className:"bc-add",
              onClick:()=>toggle(i)
            },isSelected?"✓":"ADD")
          );
        }),

        React.createElement("button",{
          className:"bc-btn",
          disabled:!ready,
          onClick:()=>{
            setJoined(true);
            setPage("mycontest");
          }
        },ready?"SAVE TEAM & JOIN":"SELECT 11 + C + VC")
      ),

      page==="mycontest" && React.createElement("div",{className:"bc-card"},
        React.createElement("h2",null,
          joined?"My Contest ✓":"My Contest"),
        React.createElement("p",null,"Team 1 • Mega Contest"),
        React.createElement("div",{className:"bc-stats"},
          React.createElement("div",{className:"bc-stat"},"ENTRY",
            React.createElement("b",null,"₹49")),
          React.createElement("div",{className:"bc-stat"},"TEAM",
            React.createElement("b",null,"TEAM 1")),
          React.createElement("div",{className:"bc-stat"},"STATUS",
            React.createElement("b",null,"JOINED"))
        ),
        React.createElement("button",{
          className:"bc-btn",
          onClick:()=>setPage("leaderboard")
        },"VIEW LEADERBOARD")
      ),

      page==="leaderboard" && React.createElement("div",{className:"bc-card"},
        React.createElement("h2",null,"Leaderboard"),
        [
          ["1","YOU • TEAM 1","1000"],
          ["2","BATZO PRO","975"],
          ["3","CRICKET KING","950"],
          ["4","CHAMPION XI","925"]
        ].map(x=>
          React.createElement("div",{className:"bc-rank",key:x[0]},
            React.createElement("b",null,"#"+x[0]+" "+x[1]),
            React.createElement("b",{className:"bc-green"},x[2]+" pts")
          )
        ),
        React.createElement("button",{
          className:"bc-btn",
          onClick:onClose
        },"BACK TO HOME")
      )
    )
  );
}
