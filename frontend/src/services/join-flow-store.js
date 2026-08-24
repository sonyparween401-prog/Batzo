const KEY = "batzo_join_entries_v2";
const read = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(x) ? x : []; } catch { return []; } };
const write = x => { localStorage.setItem(KEY, JSON.stringify(x)); return x; };
export const getJoinEntries = () => read();
export const getMyContests = (userId = "local-user") => read().filter(x => String(x.userId) === String(userId));
export const hasJoined = ({userId="local-user",contestId}) => read().some(x => String(x.userId) === String(userId) && String(x.contestId) === String(contestId));
export const createJoinEntry = data => {
  if (!data.matchId || !data.contestId || !data.teamId) throw new Error("Match, contest and team are required.");
  const list = read();
  if (list.some(x => String(x.userId) === String(data.userId || "local-user") && String(x.contestId) === String(data.contestId))) throw new Error("Already joined this contest.");
  const entry = {...data,id:"join_"+Date.now(),userId:data.userId || "local-user",status:"JOINED",joinedAt:new Date().toISOString()};
  write([...list,entry]); return entry;
};
