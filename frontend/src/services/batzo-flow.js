const KEYS = {
  wallet: "batzo_wallet_v3",
  ledger: "batzo_entry_ledger_v3",
  contests: "batzo_my_contests_v3",
  teams: "batzo_my_teams_v3",
  match: "batzo_active_match_v3"
};

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("batzo:data", { detail: { key, value } }));
  return value;
}

function money(v) {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function getWallet() {
  const old = read(KEYS.wallet, null);
  if (old && typeof old === "object") {
    return {
      balance: Number(old.balance || 0),
      totalDeposited: Number(old.totalDeposited || 0),
      totalEntry: Number(old.totalEntry || 0)
    };
  }

  const legacy = Number(localStorage.getItem("batzo_wallet_balance"));
  return {
    balance: Number.isFinite(legacy) ? legacy : 0,
    totalDeposited: 0,
    totalEntry: 0
  };
}

export function setWalletBalance(balance) {
  const w = getWallet();
  return write(KEYS.wallet, {
    ...w,
    balance: Math.max(0, Number(balance) || 0)
  });
}

export function addMoney(amount) {
  const n = money(amount);
  if (n <= 0) return getWallet();
  const w = getWallet();
  return write(KEYS.wallet, {
    ...w,
    balance: w.balance + n,
    totalDeposited: w.totalDeposited + n
  });
}

export function getLedger() {
  return read(KEYS.ledger, []);
}

export function getMyContests() {
  return read(KEYS.contests, []);
}

export function getTeams() {
  return read(KEYS.teams, []);
}

export function saveTeam(team) {
  const teams = getTeams();
  const id = String(team?.id || team?.teamId || `team-${Date.now()}`);
  const clean = { ...team, id };
  const next = teams.filter(t => String(t.id) !== id);
  next.push(clean);
  write(KEYS.teams, next);
  return clean;
}

export function setActiveMatch(match) {
  return write(KEYS.match, match || null);
}

export function getActiveMatch() {
  return read(KEYS.match, null);
}

export function extractEntryFee(text) {
  const s = String(text || "").replace(/,/g, "");
  const patterns = [
    /(?:entry|join|fee)\s*[:₹$]?\s*(\d+(?:\.\d+)?)/i,
    /₹\s*(\d+(?:\.\d+)?)/,
    /\b(\d+(?:\.\d+)?)\s*(?:credits?|rs\.?|inr)\b/i
  ];

  for (const p of patterns) {
    const m = s.match(p);
    if (m) return Number(m[1]);
  }

  return 0;
}

export function makeContestId(contest) {
  return String(
    contest?.id ||
    contest?.contestId ||
    contest?.contest_id ||
    contest?.key ||
    contest?.name ||
    `contest-${Date.now()}`
  ).trim();
}

export function joinContest({ contest, team, match, entryFee }) {
  const fee = Number(entryFee || extractEntryFee(JSON.stringify(contest))) || 0;
  const contestId = makeContestId(contest);
  const teamId = String(team?.id || team?.teamId || team?.name || "team-1");
  const matchId = String(
    match?.id ||
    match?.matchId ||
    match?.match_id ||
    contest?.matchId ||
    contest?.match_id ||
    "match-1"
  );

  const joined = getMyContests();

  const duplicate = joined.find(x =>
    String(x.contestId) === contestId &&
    String(x.teamId) === teamId &&
    String(x.matchId) === matchId
  );

  if (duplicate) {
    return {
      ok: false,
      duplicate: true,
      message: "Contest already joined",
      contest: duplicate
    };
  }

  const wallet = getWallet();

  if (fee > 0 && wallet.balance < fee) {
    return {
      ok: false,
      insufficient: true,
      message: `Insufficient wallet balance. Required ₹${fee}`
    };
  }

  const now = new Date().toISOString();

  const record = {
    id: `${matchId}-${contestId}-${teamId}`,
    matchId,
    contestId,
    teamId,
    match: match || null,
    contest: contest || null,
    team: team || null,
    entryFee: fee,
    joinedAt: now,
    status: "JOINED"
  };

  const nextWallet = {
    ...wallet,
    balance: Math.max(0, wallet.balance - fee),
    totalEntry: wallet.totalEntry + fee
  };

  write(KEYS.wallet, nextWallet);
  write(KEYS.ledger, [
    ...getLedger(),
    {
      id: `entry-${Date.now()}`,
      type: "CONTEST_ENTRY",
      amount: fee,
      matchId,
      contestId,
      teamId,
      createdAt: now,
      status: "SUCCESS"
    }
  ]);
  write(KEYS.contests, [...joined, record]);

  return {
    ok: true,
    contest: record,
    wallet: nextWallet
  };
}

export function installBatzoFlow() {
  if (window.__BATZO_FLOW_V3__) return;
  window.__BATZO_FLOW_V3__ = true;

  window.BatzoFlow = {
    getWallet,
    setWalletBalance,
    addMoney,
    getLedger,
    getMyContests,
    getTeams,
    saveTeam,
    setActiveMatch,
    getActiveMatch,
    joinContest,
    extractEntryFee
  };

  const text = el => (el?.innerText || el?.textContent || "").trim();

  const findContainer = el =>
    el?.closest?.(
      "[class*='contest'],[class*='card'],article,section,li,div"
    ) || el?.parentElement;

  (()=>{})(
    "click",
    e => {
      const button = e.target.closest?.("button,[role='button'],a");
      if (!button) return;

      const label = text(button).replace(/\s+/g, " ").trim();
      const upper = label.toUpperCase();

      if (
        upper.includes("MY CONTESTS") ||
        upper === "MY CONTEST" ||
        upper.includes("TRACK ENTRIES")
      ) {
        e.preventDefault();
        e.stopPropagation();

        const contests = getMyContests();

        const rows = contests.length
          ? contests.map((c, i) => `
              <div class="batzo-my-row">
                <b>${c.contest?.name || c.contest?.title || `Contest ${i + 1}`}</b>
                <span>${c.match?.name || c.match?.title || c.matchId}</span>
                <span>Team: ${c.team?.name || c.teamId}</span>
                <strong>₹${c.entryFee}</strong>
                <em>${c.status}</em>
              </div>
            `).join("")
          : `<div class="batzo-empty">No joined contests yet.</div>`;

        showModal(
          "My Contests",
          `<div class="batzo-wallet-line">Joined: <b>${contests.length}</b></div>${rows}`,
          "CLOSE"
        );
        return;
      }

      if (
        upper.includes("JOIN CONTEST") ||
        upper === "JOIN" ||
        upper.includes("JOIN NOW")
      ) {
        const container = findContainer(button);
        const raw = text(container);

        const fee =
          Number(button.dataset.entryFee || button.dataset.fee || 0) ||
          extractEntryFee(raw);

        const contest = {
          id:
            button.dataset.contestId ||
            container?.dataset?.contestId ||
            undefined,
          contestId:
            button.dataset.contestId ||
            container?.dataset?.contestId ||
            undefined,
          name: raw.slice(0, 180),
          title: raw.slice(0, 180),
          raw
        };

        const activeMatch = getActiveMatch() || {
          id: button.dataset.matchId || "match-1",
          matchId: button.dataset.matchId || "match-1",
          name: "Current Match"
        };

        const teams = getTeams();
        const team = teams[0] || {
          id: "team-1",
          name: "Team 1"
        };

        const result = joinContest({
          contest,
          team,
          match: activeMatch,
          entryFee: fee
        });

        if (result.ok) {
          e.preventDefault();
          e.stopPropagation();

          showModal(
            "Contest Joined",
            `
              <div class="batzo-success">✓ JOINED SUCCESSFULLY</div>
              <p>Team: <b>${team.name || "Team 1"}</b></p>
              <p>Entry Fee: <b>₹${fee}</b></p>
              <p>Wallet Balance: <b>₹${result.wallet.balance}</b></p>
              <p>Your contest has been added to <b>My Contests</b>.</p>
            `,
            "VIEW MY CONTESTS"
          );

          return;
        }

        if (result.duplicate || result.insufficient) {
          e.preventDefault();
          e.stopPropagation();

          showModal(
            result.duplicate ? "Already Joined" : "Wallet",
            `<div class="batzo-warning">${result.message}</div>`,
            "CLOSE"
          );
        }
      }
    },
    true
  );

  window.addEventListener("batzo:data", () => {
    window.dispatchEvent(new Event("storage"));
  });
}

function installStyle() {
  if (document.getElementById("batzo-flow-v3-style")) return;

  const s = document.createElement("style");
  s.id = "batzo-flow-v3-style";
  s.textContent = `
    .batzo-overlay-v3{
      position:fixed;inset:0;z-index:2147483000;
      background:rgba(0,0,0,.76);
      display:flex;align-items:center;justify-content:center;
      padding:18px;box-sizing:border-box;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
    }
    .batzo-modal-v3{
      width:min(620px,100%);
      max-height:82vh;overflow:auto;
      background:#10161d;color:#fff;
      border:1px solid #29343f;border-radius:26px;
      padding:24px;box-sizing:border-box;
      box-shadow:0 25px 80px rgba(0,0,0,.65)
    }
    .batzo-modal-v3 h2{
      margin:0 0 18px;font-size:28px
    }
    .batzo-wallet-line{
      padding:14px 16px;background:#17212a;
      border-radius:14px;margin-bottom:12px
    }
    .batzo-my-row{
      display:grid;gap:5px;
      padding:15px 4px;border-bottom:1px solid #29313a
    }
    .batzo-my-row span{color:#9ca7b5}
    .batzo-my-row strong,.batzo-my-row em{
      color:#24e875;font-style:normal
    }
    .batzo-empty,.batzo-warning{
      padding:20px;border-radius:16px;
      background:#19232c;color:#cbd3dc
    }
    .batzo-success{
      color:#24e875;font-size:20px;font-weight:800;
      margin-bottom:16px
    }
    .batzo-modal-v3 button{
      width:100%;margin-top:18px;padding:16px;
      border:0;border-radius:16px;
      background:#20df72;color:#07110b;
      font-size:17px;font-weight:800
    }
  `;
  document.head.appendChild(s);
}

function showModal(title, body, action) {
  const old = document.getElementById("batzo-flow-modal-v3");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "batzo-flow-modal-v3";
  overlay.className = "batzo-overlay-v3";

  overlay.innerHTML = `
    <div class="batzo-modal-v3">
      <h2>${title}</h2>
      <div>${body}</div>
      <button>${action}</button>
    </div>
  `;

  const btn = overlay.querySelector("button");
  btn.onclick = () => {
    overlay.remove();

    if (action.includes("MY CONTESTS")) {
      const contests = getMyContests();
      const rows = contests.length
        ? contests.map((c,i) => `
          <div class="batzo-my-row">
            <b>${c.contest?.name || `Contest ${i+1}`}</b>
            <span>Team: ${c.team?.name || c.teamId}</span>
            <strong>₹${c.entryFee}</strong>
            <em>${c.status}</em>
          </div>
        `).join("")
        : `<div class="batzo-empty">No joined contests yet.</div>`;

      showModal("My Contests", rows, "CLOSE");
    }
  };

  document.body.appendChild(overlay);
}

function boot() {
  installStyle();
  installBatzoFlow();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once:true });
} else {
  boot();
}

export default {
  installBatzoFlow,
  getWallet,
  getMyContests,
  joinContest
};
