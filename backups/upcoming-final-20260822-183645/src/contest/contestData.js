export const batzoContestTypes = [
  {
    id: "mega",
    name: "Mega Contest",
    short: "MEGA",
    entryFee: 49,
    prizePool: 450,
    spots: 20,
    filled: 7,
    winners: 8,
    guaranteed: true
  },
  {
    id: "small",
    name: "Small League",
    short: "SMALL",
    entryFee: 20,
    prizePool: 180,
    spots: 10,
    filled: 4,
    winners: 4,
    guaranteed: true
  },
  {
    id: "h2h",
    name: "Head to Head",
    short: "H2H",
    entryFee: 10,
    prizePool: 18,
    spots: 2,
    filled: 1,
    winners: 1,
    guaranteed: true
  },
  {
    id: "starter",
    name: "Starter Contest",
    short: "STARTER",
    entryFee: 5,
    prizePool: 9,
    spots: 2,
    filled: 1,
    winners: 1,
    guaranteed: true
  }
];

export const batzoPrizeBreakup = {
  mega: [
    ["1st", 180],
    ["2nd", 90],
    ["3rd", 54],
    ["4th", 36],
    ["5th", 27],
    ["6th-8th", 21]
  ],
  small: [
    ["1st", 90],
    ["2nd", 45],
    ["3rd", 27],
    ["4th", 18]
  ],
  h2h: [
    ["1st", 18]
  ],
  starter: [
    ["1st", 9]
  ]
};
