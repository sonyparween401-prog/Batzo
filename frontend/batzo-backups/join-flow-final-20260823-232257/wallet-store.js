const KEY = "batzo_wallet_v2";
const base = {balance:0,winnings:0,deposited:0,bonus:0,transactions:[]};
const read = () => { try { const x=JSON.parse(localStorage.getItem(KEY)||"null"); return {...base,...(x||{}),transactions:Array.isArray(x?.transactions)?x.transactions:[]}; } catch { return {...base}; } };
const write = x => { localStorage.setItem(KEY,JSON.stringify(x)); return x; };
export const getWallet = () => read();
export const getWalletBalance = () => Number(read().balance || 0);
export const canJoinWithWallet = amount => { const fee=Number(amount||0),w=read(); if(!Number.isFinite(fee)||fee<0)return {valid:false,reason:"Invalid entry fee."}; if(w.balance<fee)return {valid:false,reason:`Insufficient wallet balance. Required ₹${fee}, available ₹${w.balance}.`}; return {valid:true,wallet:w}; };
export const debitForContest = ({amount,contestId,matchId,teamId}) => { const fee=Number(amount||0),w=read(); if(!Number.isFinite(fee)||fee<=0) throw new Error("Invalid contest entry fee."); if(w.balance<fee) throw new Error(`Insufficient wallet balance. Required ₹${fee}, available ₹${w.balance}.`); return write({...w,balance:Number((w.balance-fee).toFixed(2)),transactions:[...w.transactions,{id:"txn_"+Date.now(),type:"CONTEST_ENTRY",amount:-fee,contestId,matchId,teamId,status:"SUCCESS",createdAt:new Date().toISOString()}]}); };
