export function selectContest(contest) {
  const value = contest || {};

  window.__BATZO_SELECTED_CONTEST__ = value;

  try {
    localStorage.setItem(
      "batzo_selected_contest",
      JSON.stringify(value)
    );
  } catch {}

  window.dispatchEvent(
    new CustomEvent("batzo:contest-selected", {
      detail: value
    })
  );
}

export function selectTeam(team) {
  const value = team || {};

  const id =
    typeof value === "string"
      ? value
      : value.id ||
        value.teamId ||
        value.team_id ||
        value.name;

  if (id) {
    localStorage.setItem(
      "batzo_selected_team",
      String(id)
    );

    localStorage.setItem(
      "batzo_active_team",
      String(id)
    );
  }

  window.__BATZO_SELECTED_TEAM__ = value;

  window.dispatchEvent(
    new CustomEvent("batzo:team-selected", {
      detail: value
    })
  );
}
