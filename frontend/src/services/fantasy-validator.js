import { TEAM_RULES } from "../data/fantasy-players.js";

export function validateFantasyTeam(players, captainId, viceCaptainId) {

  if (!Array.isArray(players)) {
    return {ok:false,error:"Invalid player list"};
  }

  if (players.length !== TEAM_RULES.totalPlayers) {
    return {ok:false,error:"Exactly 11 players required"};
  }

  const ids = players.map(p => p.id);

  if (new Set(ids).size !== ids.length) {
    return {ok:false,error:"Duplicate player selected"};
  }

  const credits = players.reduce(
    (sum,p) => sum + Number(p.credits || 0),0
  );

  if (credits > TEAM_RULES.maxCredits) {
    return {ok:false,error:"Maximum 100 credits allowed"};
  }

  const count = role =>
    players.filter(p => p.role === role).length;

  const wk = count("WK");
  const bat = count("BAT");
  const ar = count("AR");
  const bowl = count("BOWL");

  if (wk < TEAM_RULES.minWK || wk > TEAM_RULES.maxWK)
    return {ok:false,error:"Invalid wicket-keeper combination"};

  if (bat < TEAM_RULES.minBAT || bat > TEAM_RULES.maxBAT)
    return {ok:false,error:"Invalid batter combination"};

  if (ar < TEAM_RULES.minAR || ar > TEAM_RULES.maxAR)
    return {ok:false,error:"Invalid all-rounder combination"};

  if (bowl < TEAM_RULES.minBOWL || bowl > TEAM_RULES.maxBOWL)
    return {ok:false,error:"Invalid bowler combination"};

  const ind = players.filter(p => p.team === "IND").length;
  const aus = players.filter(p => p.team === "AUS").length;

  if (ind > TEAM_RULES.maxFromOneTeam ||
      aus > TEAM_RULES.maxFromOneTeam) {
    return {ok:false,error:"Maximum 7 players from one team"};
  }

  if (!captainId || !viceCaptainId)
    return {ok:false,error:"Captain and Vice-Captain required"};

  if (captainId === viceCaptainId)
    return {ok:false,error:"Captain and Vice-Captain must be different"};

  if (!ids.includes(captainId))
    return {ok:false,error:"Captain must be selected"};

  if (!ids.includes(viceCaptainId))
    return {ok:false,error:"Vice-Captain must be selected"};

  return {
    ok:true,
    credits,
    roles:{wk,bat,ar,bowl},
    teams:{IND:ind,AUS:aus}
  };
}
