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
