const RULES = {
  totalPlayers:11,
  maxCredits:100,
  maxFromOneTeam:7,
  minWK:1,
  maxWK:4,
  minBAT:3,
  maxBAT:6,
  minAR:1,
  maxAR:4,
  minBOWL:3,
  maxBOWL:6
};

function validateTeam(players,captainId,viceCaptainId){

  if(!Array.isArray(players) || players.length !== 11)
    return {ok:false,error:"Exactly 11 players required"};

  const ids=players.map(p=>p.id);

  if(new Set(ids).size !== ids.length)
    return {ok:false,error:"Duplicate players"};

  const credits=players.reduce(
    (s,p)=>s+Number(p.credits||0),0
  );

  if(credits>RULES.maxCredits)
    return {ok:false,error:"Credits exceed 100"};

  const role=r=>players.filter(p=>p.role===r).length;

  if(role("WK")<RULES.minWK || role("WK")>RULES.maxWK)
    return {ok:false,error:"Invalid WK count"};

  if(role("BAT")<RULES.minBAT || role("BAT")>RULES.maxBAT)
    return {ok:false,error:"Invalid BAT count"};

  if(role("AR")<RULES.minAR || role("AR")>RULES.maxAR)
    return {ok:false,error:"Invalid AR count"};

  if(role("BOWL")<RULES.minBOWL || role("BOWL")>RULES.maxBOWL)
    return {ok:false,error:"Invalid BOWL count"};

  const ind=players.filter(p=>p.team==="IND").length;
  const aus=players.filter(p=>p.team==="AUS").length;

  if(ind>RULES.maxFromOneTeam || aus>RULES.maxFromOneTeam)
    return {ok:false,error:"Maximum 7 players from one team"};

  if(!captainId || !viceCaptainId)
    return {ok:false,error:"C/VC required"};

  if(captainId===viceCaptainId)
    return {ok:false,error:"C and VC cannot be same"};

  if(!ids.includes(captainId) || !ids.includes(viceCaptainId))
    return {ok:false,error:"C/VC must be selected players"};

  return {
    ok:true,
    credits,
    roles:{
      WK:role("WK"),
      BAT:role("BAT"),
      AR:role("AR"),
      BOWL:role("BOWL")
    },
    teams:{IND:ind,AUS:aus}
  };
}

module.exports={validateTeam};
