export const batzoPlayers = [
  { id:"p01", name:"R. Sharma", role:"BAT", team:"IND", credits:9.5, points:84 },
  { id:"p02", name:"V. Kohli", role:"BAT", team:"IND", credits:10.0, points:96 },
  { id:"p03", name:"S. Gill", role:"BAT", team:"IND", credits:9.0, points:72 },
  { id:"p04", name:"S. Yadav", role:"BAT", team:"IND", credits:8.5, points:67 },
  { id:"p05", name:"H. Pandya", role:"AR", team:"IND", credits:9.0, points:88 },
  { id:"p06", name:"R. Jadeja", role:"AR", team:"IND", credits:9.0, points:91 },
  { id:"p07", name:"J. Bumrah", role:"BOWL", team:"IND", credits:9.5, points:103 },
  { id:"p08", name:"M. Siraj", role:"BOWL", team:"IND", credits:8.5, points:61 },
  { id:"p09", name:"K. Rahul", role:"WK", team:"IND", credits:9.0, points:78 },
  { id:"p10", name:"T. Head", role:"BAT", team:"AUS", credits:9.5, points:94 },
  { id:"p11", name:"S. Smith", role:"BAT", team:"AUS", credits:8.5, points:65 },
  { id:"p12", name:"G. Maxwell", role:"AR", team:"AUS", credits:9.0, points:83 },
  { id:"p13", name:"P. Cummins", role:"AR", team:"AUS", credits:9.0, points:76 },
  { id:"p14", name:"M. Starc", role:"BOWL", team:"AUS", credits:9.0, points:82 },
  { id:"p15", name:"A. Zampa", role:"BOWL", team:"AUS", credits:8.5, points:70 },
  { id:"p16", name:"J. Inglis", role:"WK", team:"AUS", credits:8.5, points:59 }
];

export const roleRules = {
  WK: { min:1, max:4 },
  BAT: { min:3, max:6 },
  AR: { min:1, max:4 },
  BOWL: { min:3, max:6 }
};

export const MAX_PLAYERS = 11;
export const MAX_CREDITS = 100;
