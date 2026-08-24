export function validateContestJoin({contest={},walletBalance=0,matchId,team={},userId}) {
  const fee=Number(contest.entryFee ?? contest.entry ?? 0);
  if(!userId)return {valid:false,reason:"User is required."};
  if(!matchId)return {valid:false,reason:"Match is required."};
  if(team.matchId && String(team.matchId)!==String(matchId))return {valid:false,reason:"Team belongs to another match."};
  if(contest.status && String(contest.status).toUpperCase()!=="OPEN")return {valid:false,reason:"Contest is not open."};
  if(Number(walletBalance)<fee)return {valid:false,reason:"Insufficient wallet balance."};
  return {valid:true,entryFee:fee};
}
