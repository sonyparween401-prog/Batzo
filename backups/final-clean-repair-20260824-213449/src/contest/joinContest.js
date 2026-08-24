import {createJoinEntry,hasJoined} from "../services/join-flow-store";
import {canJoinWithWallet,debitForContest} from "../services/wallet-store";
import {getMatchId,getContestId,getTeamId,teamBelongsToMatch} from "../services/matchBinding";
export function joinContest({userId="local-user",match,contest,team}) {
  const matchId=getMatchId(match),contestId=getContestId(contest),teamId=getTeamId(team);
  if(!matchId)return {success:false,reason:"Match is not selected."};
  if(!contestId)return {success:false,reason:"Contest is not selected."};
  if(!teamId)return {success:false,reason:"Please select a team."};
  if(hasJoined({userId,contestId}))return {success:false,reason:"You have already joined this contest."};
  if(!teamBelongsToMatch(team,match))return {success:false,reason:"This team belongs to a different match."};
  const players=Array.isArray(team.players)?team.players:[];
  if(players.length!==11)return {success:false,reason:"Team must contain exactly 11 players."};
  const fee=Number(contest.entryFee ?? contest.entry ?? 0);
  const check=canJoinWithWallet(fee);
  if(!check.valid)return {success:false,reason:check.reason};
  try { debitForContest({amount:fee,contestId,matchId,teamId}); const entry=createJoinEntry({userId,matchId,contestId,teamId,entryFee:fee,contestName:contest.name||contest.title||"Fantasy Contest",matchName:match.name||match.title||"Cricket Match"}); return {success:true,entry}; } catch(e) { return {success:false,reason:e?.message||"Unable to join contest."}; }
}
