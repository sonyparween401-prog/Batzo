const KEYS = {
  contest: "batzo_selected_contest",
  team: "batzo_selected_team",
  joined: "batzo_my_contests",
  wallet: "batzo_wallet",
  balance: "batzo_wallet_balance",
  ledger: "batzo_wallet_ledger"
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return "₹" + Math.max(0, Number(value) || 0).toFixed(0);
}

function walletBalance() {
  const wallet = read(KEYS.wallet, null);

  if (
    wallet &&
    Number.isFinite(Number(wallet.balance))
  ) {
    return Number(wallet.balance);
  }

  const value = Number(
    localStorage.getItem(KEYS.balance)
  );

  return Number.isFinite(value) ? value : 0;
}

function setWalletBalance(value) {
  const balance = Math.max(0, Number(value) || 0);

  localStorage.setItem(
    KEYS.balance,
    String(balance)
  );

  const wallet = read(KEYS.wallet, {});

  write(KEYS.wallet, {
    ...wallet,
    balance
  });

  window.dispatchEvent(
    new CustomEvent("batzo:wallet-updated", {
      detail: { balance }
    })
  );
}

function joinedContests() {
  return read(KEYS.joined, []);
}

function getPageText(element) {
  const card =
    element.closest(
      "article,section,[class*='card'],[class*='contest']"
    );

  return (
    card?.innerText ||
    element.parentElement?.innerText ||
    element.innerText ||
    ""
  ).slice(0, 2500);
}

function extractNumber(text, pattern) {
  const match = text.match(pattern);

  if (!match) return 0;

  return Number(
    String(match[1]).replace(/,/g, "")
  ) || 0;
}

function contestFromButton(button) {
  const card =
    button.closest(
      "article,section,[class*='card'],[class*='contest']"
    );

  const dataset = {
    ...(card?.dataset || {}),
    ...(button.dataset || {})
  };

  const text = getPageText(button);

  const contestId =
    dataset.contestId ||
    dataset.contestid ||
    dataset.id ||
    "contest-" +
      Date.now();

  const matchId =
    dataset.matchId ||
    dataset.matchid ||
    localStorage.getItem(
      "batzo_selected_match"
    ) ||
    "match-current";

  const entryFee =
    extractNumber(
      text,
      /(?:ENTRY|ENTRY FEE|JOIN|FEE)[^\d₹]{0,20}₹?\s*([\d,]+)/i
    );

  const prizePool =
    extractNumber(
      text,
      /(?:PRIZE|PRIZE POOL)[^\d₹]{0,20}₹?\s*([\d,]+)/i
    );

  const lines = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const name =
    dataset.contestName ||
    lines.find(
      x =>
        !/ENTRY|SPOTS|PRIZE|JOIN|TEAM|₹|\d+\/\d+/i.test(x)
    ) ||
    "Fantasy Contest";

  return {
    id: String(contestId),
    matchId: String(matchId),
    name: String(name).slice(0, 100),
    entryFee,
    prizePool
  };
}

function findTeams() {
  const results = [];

  const possibleKeys = [
    "batzo_teams",
    "batzo_team_store",
    "batzo_my_teams",
    "teams",
    "fantasy_teams",
    "batzo_selected_team"
  ];

  for (const key of possibleKeys) {
    try {
      const value = localStorage.getItem(key);

      if (!value) continue;

      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            results.push(item);
          }
        }
      } else if (
        parsed &&
        typeof parsed === "object"
      ) {
        results.push(parsed);
      }
    } catch {}
  }

  const unique = [];
  const seen = new Set();

  for (const team of results) {
    const id =
      team.id ||
      team.teamId ||
      team.team_id ||
      team.name;

    if (!id) continue;

    const key = String(id);

    if (seen.has(key)) continue;

    seen.add(key);

    unique.push({
      ...team,
      id: key,
      name:
        team.name ||
        "Team " + (unique.length + 1)
    });
  }

  return unique;
}

function removeOverlay() {
  document
    .getElementById("batzo-clean-overlay")
    ?.remove();
}

function showOverlay(title, body, buttons) {
  removeOverlay();

  const overlay =
    document.createElement("div");

  overlay.id =
    "batzo-clean-overlay";

  overlay.style.cssText =
    "position:fixed;inset:0;z-index:2147483647;" +
    "background:rgba(0,0,0,.78);display:flex;" +
    "align-items:center;justify-content:center;" +
    "padding:16px;font-family:system-ui,sans-serif;";

  const box =
    document.createElement("div");

  box.style.cssText =
    "width:min(430px,100%);max-height:90vh;" +
    "overflow:auto;background:#111820;color:#fff;" +
    "border:1px solid #33404b;border-radius:22px;" +
    "padding:20px;box-sizing:border-box;" +
    "box-shadow:0 20px 70px rgba(0,0,0,.65);";

  const heading =
    document.createElement("h2");

  heading.textContent = title;

  heading.style.cssText =
    "margin:0 0 10px;font-size:21px;";

  box.appendChild(heading);

  const content =
    document.createElement("div");

  content.innerHTML = body;

  box.appendChild(content);

  const row =
    document.createElement("div");

  row.style.cssText =
    "display:flex;gap:10px;margin-top:18px;";

  for (const item of buttons) {
    const button =
      document.createElement("button");

    button.textContent =
      item.label;

    button.style.cssText =
      "flex:1;border:0;border-radius:13px;" +
      "padding:13px 10px;font-weight:800;" +
      "font-size:14px;";

    button.style.background =
      item.primary ? "#39d27d" : "#27313a";

    button.style.color =
      item.primary ? "#07130c" : "#fff";

    button.onclick =
      item.onClick;

    row.appendChild(button);
  }

  box.appendChild(row);

  overlay.appendChild(box);

  overlay.addEventListener(
    "click",
    event => {
      if (event.target === overlay) {
        removeOverlay();
      }
    }
  );

  document.body.appendChild(overlay);
}

function toast(message) {
  const old =
    document.getElementById(
      "batzo-clean-toast"
    );

  old?.remove();

  const node =
    document.createElement("div");

  node.id =
    "batzo-clean-toast";

  node.textContent =
    message;

  node.style.cssText =
    "position:fixed;left:16px;right:16px;" +
    "bottom:85px;z-index:2147483647;" +
    "background:#151d24;color:#fff;" +
    "border:1px solid #33404b;" +
    "border-radius:14px;padding:14px;" +
    "font-weight:700;text-align:center;" +
    "box-shadow:0 10px 30px rgba(0,0,0,.4);";

  document.body.appendChild(node);

  setTimeout(
    () => node.remove(),
    2500
  );
}

function showWallet() {
  const balance =
    walletBalance();

  const joined =
    joinedContests().length;

  showOverlay(
    "Wallet",
    `
      <div style="
        background:#18231d;
        border:1px solid #2d6b46;
        border-radius:18px;
        padding:18px;
        text-align:center;
      ">
        <div style="
          font-size:13px;
          opacity:.75;
        ">
          AVAILABLE BALANCE
        </div>

        <div style="
          font-size:34px;
          font-weight:900;
          margin-top:6px;
        ">
          ${money(balance)}
        </div>
      </div>

      <p style="margin-top:18px">
        Joined contests:
        <b>${joined}</b>
      </p>

      <p style="opacity:.7">
        Real money is deducted only after
        a successful join and only when
        sufficient wallet balance exists.
      </p>
    `,
    [
      {
        label: "CLOSE",
        onClick: removeOverlay
      }
    ]
  );
}

function showMyContests() {
  const list =
    joinedContests();

  let body =
    "<p>No joined contests yet.</p>";

  if (list.length) {
    body =
      list
        .slice(0, 20)
        .map(item => `
          <div style="
            padding:13px 0;
            border-bottom:1px solid #29343d;
          ">
            <b>${item.contestName || "Contest"}</b>

            <div style="
              margin-top:5px;
              font-size:13px;
              opacity:.75;
            ">
              ${item.teamName || "Fantasy Team"}
              • Entry ${money(item.entryFee)}
            </div>

            <div style="
              margin-top:5px;
              font-size:12px;
              color:#57df8d;
              font-weight:800;
            ">
              ${item.status || "JOINED"}
            </div>
          </div>
        `)
        .join("");
  }

  showOverlay(
    "My Contests",
    body,
    [
      {
        label: "CLOSE",
        onClick: removeOverlay
      }
    ]
  );
}

function completeJoin(contest, team) {
  const fee =
    Number(contest.entryFee) || 0;

  const balance =
    walletBalance();

  const existing =
    joinedContests();

  const duplicate =
    existing.some(
      item =>
        String(item.contestId) ===
          String(contest.id) &&
        String(item.teamId) ===
          String(team.id)
    );

  if (duplicate) {
    showOverlay(
      "Already Joined",
      "<p>This team is already joined in this contest.</p>",
      [
        {
          label: "OK",
          onClick: removeOverlay
        }
      ]
    );

    return;
  }

  if (balance < fee) {
    showOverlay(
      "Wallet Balance",
      `
        <p>
          Entry fee:
          <b>${money(fee)}</b>
        </p>

        <p>
          Available:
          <b>${money(balance)}</b>
        </p>

        <p style="opacity:.7">
          Add funds through the real wallet/payment
          flow before joining.
        </p>
      `,
      [
        {
          label: "CLOSE",
          onClick: removeOverlay
        }
      ]
    );

    return;
  }

  const joinedAt =
    new Date().toISOString();

  const record = {
    id:
      "join-" +
      Date.now(),

    matchId:
      contest.matchId,

    contestId:
      contest.id,

    contestName:
      contest.name,

    teamId:
      team.id,

    teamName:
      team.name || "Fantasy Team",

    entryFee:
      fee,

    prizePool:
      contest.prizePool || 0,

    status:
      "JOINED",

    joinedAt
  };

  write(
    KEYS.joined,
    [record, ...existing]
  );

  if (fee > 0) {
    setWalletBalance(
      balance - fee
    );

    const ledger =
      read(KEYS.ledger, []);

    write(
      KEYS.ledger,
      [
        {
          id:
            "txn-" +
            Date.now(),

          type:
            "CONTEST_ENTRY",

          amount:
            -fee,

          contestId:
            contest.id,

          teamId:
            team.id,

          createdAt:
            joinedAt
        },
        ...ledger
      ]
    );
  }

  localStorage.removeItem(
    KEYS.contest
  );

  localStorage.removeItem(
    KEYS.team
  );

  removeOverlay();

  toast(
    "Contest joined successfully"
  );

  window.dispatchEvent(
    new CustomEvent(
      "batzo:contest-joined",
      {
        detail: record
      }
    )
  );
}

function showTeamPicker(contest) {
  const teams =
    findTeams();

  if (!teams.length) {
    showOverlay(
      "Team Required",
      `
        <p>
          No saved fantasy team was found.
        </p>

        <p style="opacity:.7">
          Create/confirm a team first, then
          return to this contest and tap JOIN.
        </p>
      `,
      [
        {
          label: "CLOSE",
          onClick: removeOverlay
        }
      ]
    );

    return;
  }

  let selected =
    teams[0];

  const body =
    document.createElement(
      "div"
    );

  const info =
    document.createElement(
      "p"
    );

  info.innerHTML =
    `
      <b>${contest.name}</b>
      <br>
      Entry:
      <b>${money(contest.entryFee)}</b>
    `;

  body.appendChild(info);

  for (const team of teams) {
    const label =
      document.createElement(
        "label"
      );

    label.style.cssText =
      "display:block;margin:10px 0;" +
      "padding:14px;border:1px solid #33404b;" +
      "border-radius:14px;cursor:pointer;";

    const radio =
      document.createElement(
        "input"
      );

    radio.type =
      "radio";

    radio.name =
      "batzo-team";

    radio.checked =
      team === teams[0];

    radio.onchange =
      () => {
        selected = team;
      };

    label.appendChild(
      radio
    );

    const span =
      document.createElement(
        "span"
      );

    span.style.marginLeft =
      "10px";

    span.innerHTML =
      `<b>${team.name || "Fantasy Team"}</b>`;

    label.appendChild(
      span
    );

    body.appendChild(
      label
    );
  }

  showOverlay(
    "Select Team",
    body.innerHTML,
    [
      {
        label: "CANCEL",
        onClick: removeOverlay
      },
      {
        label: "JOIN CONTEST",
        primary: true,
        onClick: () => {
          write(
            KEYS.team,
            selected
          );

          completeJoin(
            contest,
            selected
          );
        }
      }
    ]
  );
}

function handleJoin(button) {
  const contest =
    contestFromButton(
      button
    );

  write(
    KEYS.contest,
    contest
  );

  window.__BATZO_SELECTED_CONTEST__ =
    contest;

  showTeamPicker(
    contest
  );
}



export function installBatzoCleanRepair() {
  if (
    window.__BATZO_CLEAN_REPAIR_V2__
  ) {
    return;
  }

  window.__BATZO_CLEAN_REPAIR_V2__ =
    true;

  document.addEventListener(
    "click",
    event => {
      const button =
        event.target?.closest?.(
          "button,a,[role='button']"
        );

      if (!button) {
        return;
      }

      const text =
        (
          button.innerText ||
          button.textContent ||
          ""
        )
          .trim()
          .toUpperCase();

      if (!text) {
        return;
      }

      if (
        text.includes("MY CONTESTS")
      ) {
        event.preventDefault();
        event.stopPropagation();

        showMyContests();

        return;
      }

      if (
        text === "WALLET" ||
        text.includes("VIEW WALLET")
      ) {
        event.preventDefault();
        event.stopPropagation();

        showWallet();

        return;
      }

      if (
        text === "JOIN" ||
        text.includes("JOIN CONTEST")
      ) {
        event.preventDefault();
        event.stopPropagation();

        handleJoin(button);

        return;
      }
    },
    true
  );
}
