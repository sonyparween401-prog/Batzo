import React from "react";
import {getMyContests} from "../services/join-flow-store";
export default function MyContests({userId="local-user"}) {
  const entries=getMyContests(userId);
  return <section className="my-contests"><h2>My Contests</h2>{entries.length===0?<div className="empty-state">No joined contests yet.</div>:entries.map(e=><div className="contest-card" key={e.id}><b>{e.contestName}</b><div>{e.matchName}</div><div>Entry ₹{e.entryFee}</div><strong>{e.status}</strong></div>)}</section>;
}
