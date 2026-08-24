export const BATZO_PLAYERS = [
  {name:"Rohit Sharma",role:"Batter",team:"IND",credit:"9.5",photo:"/players/rohit-sharma.jpg"},
  {name:"Virat Kohli",role:"Batter",team:"IND",credit:"9.5",photo:"/players/virat-kohli.jpg"},
  {name:"Jasprit Bumrah",role:"Bowler",team:"IND",credit:"9.0",photo:"/players/jasprit-bumrah.jpg"},
  {name:"Hardik Pandya",role:"All-rounder",team:"IND",credit:"9.0",photo:"/players/hardik-pandya.jpg"},
  {name:"KL Rahul",role:"Wicket-keeper",team:"IND",credit:"8.5",photo:"/players/rohit-sharma.jpg"},
  {name:"Travis Head",role:"Batter",team:"AUS",credit:"9.0",photo:"/players/travis-head.jpg"},
  {name:"Pat Cummins",role:"Bowler",team:"AUS",credit:"9.0",photo:"/players/pat-cummins.jpg"}
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
