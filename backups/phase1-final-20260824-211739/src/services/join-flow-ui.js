import {
  joinContest,
  savePendingContest
} from "./join-flow.js";

function getSelectedTeamId() {
  return (
    localStorage.getItem("batzo_selected_team") ||
    localStorage.getItem("batzo_active_team") ||
    ""
  );
}

export function openJoinContest(contest = {}) {
  const selectedTeamId = getSelectedTeamId();

  const normalized = {
    matchId:
      contest.matchId ||
      contest.match_id ||
      contest.match?.id ||
      localStorage.getItem("batzo_selected_match") ||
      "demo-match",

    contestId:
      contest.contestId ||
      contest.contest_id ||
      contest.id ||
      "contest-" + Date.now(),

    teamId:
      contest.teamId ||
      contest.team_id ||
      selectedTeamId,

    entryFee:
      contest.entryFee ??
      contest.entry_fee ??
      contest.joinFee ??
      contest.join_fee ??
      contest.fee ??
      contest.entry ??
      0,

    contestName:
      contest.contestName ||
      contest.name ||
      contest.title ||
      "Contest",

    prizePool:
      contest.prizePool ||
      contest.prize ||
      "₹0"
  };

  savePendingContest(normalized);

  return joinContest(normalized);
}

export function installJoinFlow() {
  if (window.__BATZO_JOIN_FLOW_INSTALLED__) {
    return;
  }

  window.__BATZO_JOIN_FLOW_INSTALLED__ = true;

  document.addEventListener(
    "click",
    event => {
      const button =
        event.target?.closest?.(
          "button,[role='button'],a"
        );

      if (!button) return;

      const text = (
        button.textContent || ""
      ).trim().toUpperCase();

      if (!text.includes("JOIN")) return;

      if (
        text.includes("MY CONTESTS")
      ) {
        return;
      }

      const contest =
        window.__BATZO_SELECTED_CONTEST__ ||
        {};

      const result =
        openJoinContest(contest);

      if (result.ok) {
        event.preventDefault();
        event.stopPropagation();

        window.dispatchEvent(
          new CustomEvent(
            "batzo:join-success",
            {
              detail: result.data
            }
          )
        );

        alert(
          "Contest joined successfully."
        );

        return;
      }

      if (
        result.code ===
        "INSUFFICIENT_BALANCE"
      ) {
        event.preventDefault();
        event.stopPropagation();

        window.dispatchEvent(
          new CustomEvent(
            "batzo:wallet-required",
            {
              detail: result
            }
          )
        );

        alert(result.message);

        return;
      }

      if (
        result.code ===
        "TEAM_REQUIRED"
      ) {
        event.preventDefault();
        event.stopPropagation();

        alert(
          "Please select/create a fantasy team first."
        );

        return;
      }

      if (
        result.code ===
        "ALREADY_JOINED"
      ) {
        event.preventDefault();
        event.stopPropagation();

        alert(result.message);

        return;
      }
    },
    true
  );
}
