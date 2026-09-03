/*
 * BATZO PRIMARY FLOW REGISTRY
 *
 * This file defines the intended application flow.
 * Existing modules are NOT deleted.
 */

export const BATZO_PRIMARY_FLOW = Object.freeze({
  HOME: "home",
  LIVE: "live",
  UPCOMING: "upcoming",
  MATCH: "match",
  CONTESTS: "contests",
  CONTEST_DETAILS: "contest-details",
  TEAM: "team",
  CAPTAIN_VC: "captain-vc",
  CONFIRM_TEAM: "confirm-team",
  MY_TEAMS: "my-teams",
  SCOREBOARD: "scoreboard",
  SCORECARD: "scorecard",
});

export const BATZO_FLOW_ORDER = [
  BATZO_PRIMARY_FLOW.HOME,
  BATZO_PRIMARY_FLOW.LIVE,
  BATZO_PRIMARY_FLOW.UPCOMING,
  BATZO_PRIMARY_FLOW.MATCH,
  BATZO_PRIMARY_FLOW.CONTESTS,
  BATZO_PRIMARY_FLOW.CONTEST_DETAILS,
  BATZO_PRIMARY_FLOW.TEAM,
  BATZO_PRIMARY_FLOW.CAPTAIN_VC,
  BATZO_PRIMARY_FLOW.CONFIRM_TEAM,
  BATZO_PRIMARY_FLOW.MY_TEAMS
];

export function openBatzoContestFlow(match = "IND vs AUS") {
  window.dispatchEvent(
    new CustomEvent("batzo:open-primary-contest", {
      detail: { match }
    })
  );
}

export function openBatzoTeamFlow(match = "IND vs AUS") {
  window.dispatchEvent(
    new CustomEvent("batzo:open-primary-team", {
      detail: { match }
    })
  );
}
