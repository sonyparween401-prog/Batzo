const KEY = "batzo_fantasy_teams";

export function getMyTeams() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveMyTeam(team) {
  const teams = getMyTeams();

  const item = {
    id:"team-" + Date.now(),
    createdAt:new Date().toISOString(),
    ...team
  };

  teams.push(item);

  localStorage.setItem(KEY,JSON.stringify(teams));

  return item;
}

export function updateMyTeam(id,changes) {
  const teams = getMyTeams().map(team =>
    team.id === id
      ? {...team,...changes}
      : team
  );

  localStorage.setItem(KEY,JSON.stringify(teams));

  return teams;
}

export function deleteMyTeam(id) {
  const teams = getMyTeams()
    .filter(team => team.id !== id);

  localStorage.setItem(KEY,JSON.stringify(teams));

  return teams;
}
