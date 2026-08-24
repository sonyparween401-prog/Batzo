export const BATZO_FALLBACK_MATCHES = [
  {
    id: 'live-001',
    matchId: 'live-001',
    team1: 'Mumbai Tigers',
    team2: 'Delhi Kings',
    team1Name: 'Mumbai Tigers',
    team2Name: 'Delhi Kings',
    homeTeam: 'Mumbai Tigers',
    awayTeam: 'Delhi Kings',
    shortTeam1: 'MT',
    shortTeam2: 'DK',

    status: 'live',
    matchStatus: 'live',
    state: 'live',
    type: 'live',
    isLive: true,

    date: 'Today',
    time: 'Live Now',
    matchDate: 'Today',
    matchTime: 'Live Now',

    venue: 'Batzo Cricket Stadium',
    stadium: 'Batzo Cricket Stadium',
    format: 'T20',
    matchFormat: 'T20',

    score1: '148/4',
    score2: '132/7',
    overs: '18.2 / 20 OVERS',
    league: 'BATZO PREMIER LEAGUE'
  },

  {
    id: 'upcoming-001',
    matchId: 'upcoming-001',
    team1: 'Chennai Lions',
    team2: 'Kolkata Riders',
    team1Name: 'Chennai Lions',
    team2Name: 'Kolkata Riders',
    homeTeam: 'Chennai Lions',
    awayTeam: 'Kolkata Riders',
    shortTeam1: 'CL',
    shortTeam2: 'KR',

    status: 'upcoming',
    matchStatus: 'upcoming',
    state: 'upcoming',
    type: 'upcoming',
    isLive: false,

    date: 'Today',
    time: '7:30 PM',
    matchDate: 'Today',
    matchTime: '7:30 PM',

    venue: 'Batzo Cricket Stadium',
    stadium: 'Batzo Cricket Stadium',
    format: 'T20',
    matchFormat: 'T20',

    league: 'BATZO CRICKET'
  },

  {
    id: 'upcoming-002',
    matchId: 'upcoming-002',
    team1: 'Bangalore Stars',
    team2: 'Hyderabad Warriors',
    team1Name: 'Bangalore Stars',
    team2Name: 'Hyderabad Warriors',
    homeTeam: 'Bangalore Stars',
    awayTeam: 'Hyderabad Warriors',
    shortTeam1: 'BS',
    shortTeam2: 'HW',

    status: 'upcoming',
    matchStatus: 'upcoming',
    state: 'upcoming',
    type: 'upcoming',
    isLive: false,

    date: 'Tomorrow',
    time: '3:30 PM',
    matchDate: 'Tomorrow',
    matchTime: '3:30 PM',

    venue: 'Batzo Cricket Stadium',
    stadium: 'Batzo Cricket Stadium',
    format: 'T20',
    matchFormat: 'T20',

    league: 'BATZO CRICKET'
  }
];

export function batzoNormalizeMatches(data) {
  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data?.matches)) {
    list = data.matches;
  } else if (Array.isArray(data?.data)) {
    list = data.data;
  } else if (Array.isArray(data?.data?.matches)) {
    list = data.data.matches;
  } else if (Array.isArray(data?.result)) {
    list = data.result;
  }

  if (!list.length) {
    return BATZO_FALLBACK_MATCHES;
  }

  return list.map((m, i) => ({
    ...m,

    id: m.id || m.matchId || `match-${i}`,
    matchId: m.matchId || m.id || `match-${i}`,

    team1: m.team1 || m.team1Name || m.homeTeam || m.home || 'Team 1',
    team2: m.team2 || m.team2Name || m.awayTeam || m.away || 'Team 2',

    team1Name:
      m.team1Name || m.team1 || m.homeTeam || m.home || 'Team 1',

    team2Name:
      m.team2Name || m.team2 || m.awayTeam || m.away || 'Team 2',

    status: String(
      m.status || m.matchStatus || m.state || m.type || 'upcoming'
    ).toLowerCase(),

    matchStatus: String(
      m.matchStatus || m.status || m.state || m.type || 'upcoming'
    ).toLowerCase(),

    state: String(
      m.state || m.status || m.matchStatus || m.type || 'upcoming'
    ).toLowerCase(),

    date: m.date || m.matchDate || 'Date unavailable',
    time: m.time || m.matchTime || 'Time unavailable',

    venue:
      m.venue ||
      m.stadium ||
      m.ground ||
      m.location ||
      'Batzo Cricket Stadium',

    format: m.format || m.matchFormat || 'T20'
  }));
}
