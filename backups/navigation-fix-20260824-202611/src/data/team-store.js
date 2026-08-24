const KEY = "batzo_my_teams";

export function getTeams() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTeam(team) {
  const teams = getTeams();
  const item = {
    ...team,
    id: "team-" + Date.now()
  };

  teams.push(item);
  localStorage.setItem(KEY, JSON.stringify(teams));

  return item;
}

export function clearTeams() {
  localStorage.removeItem(KEY);
}
