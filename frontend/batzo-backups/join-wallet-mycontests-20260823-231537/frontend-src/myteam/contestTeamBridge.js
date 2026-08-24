export function saveBatzoTeam(team) {
  localStorage.setItem("batzoMyTeam", JSON.stringify(team));

  const old =
    JSON.parse(localStorage.getItem("batzoJoinedContests") || "[]");

  const contest = team?.contest;

  if (contest) {
    const exists = old.find(
      item =>
        item.contest?.id === contest.id
    );

    if (!exists) {
      old.push({
        id: "joined-" + Date.now(),
        contest,
        teamId: team.id,
        team,
        status: "LIVE"
      });

      localStorage.setItem(
        "batzoJoinedContests",
        JSON.stringify(old)
      );
    }
  }

  return team;
}

export function getBatzoMyTeam() {
  try {
    return JSON.parse(
      localStorage.getItem("batzoMyTeam") || "null"
    );
  } catch {
    return null;
  }
}

export function getBatzoJoinedContests() {
  try {
    return JSON.parse(
      localStorage.getItem("batzoJoinedContests") || "[]"
    );
  } catch {
    return [];
  }
}
