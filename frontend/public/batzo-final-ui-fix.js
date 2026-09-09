(function () {
  "use strict";

  if (window.__BATZO_COMPLETE_UI_V15__) return;
  window.__BATZO_COMPLETE_UI_V15__ = true;

  var LOGO = "/batzo-assets/Batzo-Final-Logo.svg?v=15";
  var FALLBACK_LOGO = "/batzo-logo.svg?v=15";
  var OPEN_TAB_KEY = "batzo_open_tab_v15";
  var matchDefaultApplied = false;

  var builtInContests = [
    {
      id: 1,
      name: "BATZO FREE DEMO CONTEST",
      title: "BATZO FREE DEMO CONTEST",
      prize: "₹0",
      prizePool: 0,
      entry: "₹0",
      entryFee: 0,
      spots: 100,
      type: "practice",
      practice: true,
      isPractice: true,
      isDemo: true
    },
    {
      id: "contest-mega",
      name: "Mega Contest",
      title: "Mega Contest",
      prize: "₹50 Lakhs",
      prizePool: 5000000,
      entry: "₹49",
      entryFee: 49,
      spots: 210000,
      type: "popular"
    },
    {
      id: "contest-head",
      name: "Head To Head",
      title: "Head To Head",
      prize: "₹1,800",
      prizePool: 1800,
      entry: "₹49",
      entryFee: 49,
      spots: 2,
      type: "popular"
    },
    {
      id: "contest-small",
      name: "Small Contest",
      title: "Small Contest",
      prize: "₹25,000",
      prizePool: 25000,
      entry: "₹99",
      entryFee: 99,
      spots: 1000,
      type: "popular"
    }
  ];

  function contestKey(contest) {
    return String(contest && (contest.id || contest.name || contest.title) || "").toLowerCase();
  }

  function publishContests() {
    var existing = Array.isArray(window.BATZO_CONTESTS) ? window.BATZO_CONTESTS : [];
    var merged = builtInContests.slice();
    existing.forEach(function (contest) {
      if (!merged.some(function (item) { return contestKey(item) === contestKey(contest); })) {
        merged.push(contest);
      }
    });
    window.BATZO_CONTESTS = merged;
  }

  publishContests();

  var style = document.createElement("style");
  style.id = "batzo-complete-ui-v15-style";
  style.textContent = [
    "section.batzo-hidden-home-section{display:block!important}",
    ".top-header{min-height:88px!important;padding:9px 12px!important;gap:8px!important;align-items:center!important;overflow:hidden!important}",
    ".logo-area{flex:0 1 auto!important;width:clamp(155px,calc(100vw - 145px),225px)!important;height:72px!important;min-width:0!important;padding:0!important;display:flex!important;align-items:center!important;overflow:visible!important}",
    ".batzo-final-header-logo{display:block!important;width:100%!important;max-width:100%!important;height:100%!important;max-height:72px!important;object-fit:contain!important;object-position:left center!important;filter:drop-shadow(0 4px 10px rgba(0,0,0,.75))!important}",
    ".top-header .header-right{flex:0 0 auto!important;margin-left:auto!important}",
    ".top-header .notification-btn{flex:0 0 43px!important;width:43px!important;height:43px!important;border-radius:13px!important}",
    ".top-header>button[aria-label='Profile']{flex:0 0 43px!important;width:43px!important;height:43px!important;margin-left:0!important;padding:0!important;font-size:0!important}",
    ".top-header>button[aria-label='Profile']::before{content:'👤';font-size:20px!important}",
    ".bz-flow-screen{min-height:100vh!important;padding-bottom:94px!important;background:radial-gradient(circle at 12% 0,rgba(36,231,120,.09),transparent 28%),#07100d!important}",
    ".bz-flow-brand{min-height:82px;padding:8px 14px 6px;background:#050b09;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".bz-flow-brand img{display:block;width:min(215px,62vw);height:68px;object-fit:contain;object-position:left center;filter:drop-shadow(0 4px 10px rgba(0,0,0,.75))}",
    ".bz-flow-match{max-width:34vw;color:#9ca7a0;font-size:10px;font-weight:800;text-align:right;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
    ".bz-flow-bottom{position:fixed;z-index:99999;left:0;right:0;bottom:0;min-height:68px;padding:6px max(7px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));display:grid;grid-template-columns:repeat(5,1fr);background:rgba(5,9,14,.97);border-top:1px solid rgba(255,255,255,.14);box-shadow:0 -8px 28px rgba(0,0,0,.58)}",
    ".bz-flow-bottom button{min-width:0;border:0;border-radius:12px;background:transparent;color:#8f9993;padding:6px 2px;font-weight:850}",
    ".bz-flow-bottom button span{display:block;font-size:19px;line-height:21px}",
    ".bz-flow-bottom button small{display:block;margin-top:3px;font-size:8px;white-space:nowrap}",
    ".bz-flow-bottom button.active{color:#32f58a;background:rgba(50,245,138,.08)}",
    "@media(max-width:360px){.logo-area{width:155px!important;height:62px!important}.batzo-final-header-logo{max-height:62px!important}.top-header .notification-btn,.top-header>button[aria-label='Profile']{flex-basis:40px!important;width:40px!important;height:40px!important}.bz-flow-brand img{width:185px;height:62px}}"
  ].join("");
  document.head.appendChild(style);

  function readMatch() {
    if (window.BATZO_ACTIVE_MATCH) return window.BATZO_ACTIVE_MATCH;
    try {
      var saved = JSON.parse(localStorage.getItem("batzo_selected_match") || "null");
      if (saved && typeof saved === "object") return saved;
    } catch (_) {}
    return null;
  }

  function matchLabel(match) {
    if (!match) return "Select a match first";
    var raw = match.raw || match;
    var teams = Array.isArray(raw.teams) ? raw.teams : [];
    var left = match.ac || match.a || teams[0] || "Team A";
    var right = match.bc || match.b || teams[1] || "Team B";
    return String(left) + " vs " + String(right);
  }

  function applyLogo(img) {
    if (!img || img.dataset.batzoLogoV15 === "1") return;
    img.dataset.batzoLogoV15 = "1";
    img.onerror = function () {
      img.onerror = null;
      img.src = FALLBACK_LOGO;
    };
    img.src = LOGO;
  }

  function flowNavigation() {
    var nav = document.createElement("nav");
    nav.className = "bz-flow-bottom";
    nav.setAttribute("aria-label", "Batzo navigation");
    nav.innerHTML = [
      '<button type="button" data-bz-open-tab="home"><span>⌂</span><small>Home</small></button>',
      '<button type="button" data-bz-open-tab="matches"><span>🏏</span><small>Matches</small></button>',
      '<button type="button" data-bz-open-tab="contests"><span>🏆</span><small>Contest</small></button>',
      '<button type="button" data-bz-open-tab="teams"><span>👥</span><small>My Team</small></button>',
      '<button type="button" data-bz-open-tab="wallet"><span>◉</span><small>Wallet</small></button>'
    ].join("");
    return nav;
  }

  function ensureFlowChrome() {
    var screen = document.querySelector(".bz-flow-screen");
    if (!screen) return;

    if (!screen.querySelector(":scope > .bz-flow-brand")) {
      var brand = document.createElement("div");
      brand.className = "bz-flow-brand";
      brand.innerHTML = '<img alt="BATZO Cricket Hub"><div class="bz-flow-match"></div>';
      screen.insertBefore(brand, screen.firstChild);
      applyLogo(brand.querySelector("img"));
    }

    var selected = screen.querySelector(":scope > .bz-flow-brand .bz-flow-match");
    var label = matchLabel(readMatch());
    if (selected && selected.textContent !== label) selected.textContent = label;

    if (!screen.querySelector(":scope > .bz-flow-bottom")) {
      screen.appendChild(flowNavigation());
    }

    var titleNode = screen.querySelector("h1");
    var title = String(titleNode ? titleNode.textContent : "").trim().toUpperCase();
    var activeTab = /TEAM|CAPTAIN/.test(title) ? "teams" : title === "SELECT A MATCH" ? "matches" : "contests";
    screen.querySelectorAll(":scope > .bz-flow-bottom [data-bz-open-tab]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-bz-open-tab") === activeTab);
    });
  }

  function topAndFlags() {
    document.querySelectorAll("img.batzo-final-header-logo").forEach(applyLogo);

    document.querySelectorAll(".flag,.mini-flag,.bz-team-logo,.team-logo,.bz-team-flag").forEach(function (el) {
      var img = el.querySelector("img");
      if (img && img.dataset.batzoFlagFallback !== "1") {
        img.dataset.batzoFlagFallback = "1";
        img.addEventListener("error", function () {
          img.remove();
          if (!el.textContent.trim()) el.textContent = "🏏";
        });
      }
      if (!img && !el.textContent.trim()) el.textContent = "🏏";
    });

    ensureFlowChrome();

    var matchHub = document.querySelector(".bz-match-hub");
    if (matchHub && !matchDefaultApplied) {
      var upcoming = Array.from(matchHub.querySelectorAll(".bz-main-match-tabs button")).find(function (button) {
        return String(button.textContent || "").trim().toUpperCase() === "UPCOMING";
      });
      if (upcoming) {
        matchDefaultApplied = true;
        upcoming.click();
      }
    }
  }

  function queueTab(tab) {
    try { sessionStorage.setItem(OPEN_TAB_KEY, tab); } catch (_) {}
    location.reload();
  }

  function queuedTab() {
    var tab = "";
    try { tab = sessionStorage.getItem(OPEN_TAB_KEY) || ""; } catch (_) {}
    if (!tab) return;

    var wanted = {
      home: "HOME",
      matches: "MATCHES",
      contests: "CONTEST",
      teams: "MY TEAM",
      wallet: "WALLET"
    }[tab];
    if (!wanted) return;

    var button = Array.from(document.querySelectorAll(".bottom-navigation button")).find(function (item) {
      var small = item.querySelector("small");
      return String(small ? small.textContent : item.textContent).trim().toUpperCase() === wanted;
    });
    if (!button) return;

    try { sessionStorage.removeItem(OPEN_TAB_KEY); } catch (_) {}
    button.click();
  }

  function openContestFlow() {
    publishContests();
    window.dispatchEvent(new Event("batzo:open-contests"));
  }

  document.addEventListener("click", function (event) {
    var walletShortcut = event.target.closest && event.target.closest("button.notification-btn");
    if (walletShortcut) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      var walletButton = Array.from(document.querySelectorAll(".bottom-navigation button")).find(function (item) {
        var small = item.querySelector("small");
        return String(small ? small.textContent : "").trim().toUpperCase() === "WALLET";
      });
      if (walletButton) walletButton.click();
      else queueTab("wallet");
      return;
    }

    var forced = event.target.closest && event.target.closest("[data-bz-open-tab]");
    if (forced) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      queueTab(forced.getAttribute("data-bz-open-tab"));
      return;
    }

    var choose = event.target.closest && event.target.closest("#bzChooseRealMatch");
    if (choose) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      queueTab("matches");
      return;
    }

    var flowBack = event.target.closest && event.target.closest("#bzV11Back");
    if (flowBack) {
      var screen = flowBack.closest(".bz-flow-screen");
      var title = String(screen && screen.querySelector("h1") ? screen.querySelector("h1").textContent : "").trim().toUpperCase();
      if (title === "CONTESTS") {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        queueTab("matches");
        return;
      }
      if (title === "MY TEAMS") {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        if (window.BATZO_ACTIVE_CONTEST) {
          window.dispatchEvent(new CustomEvent("batzo:contest", { detail: { contest: window.BATZO_ACTIVE_CONTEST } }));
        } else {
          openContestFlow();
        }
        return;
      }
    }

    var contestCard = event.target.closest && event.target.closest(".contest-card");
    if (contestCard) {
      var contestNameNode = contestCard.querySelector(".contest-info b");
      var contestName = String(contestNameNode ? contestNameNode.textContent : "").trim().toUpperCase();
      var contest = (window.BATZO_CONTESTS || []).find(function (item) {
        return String(item.name || item.title || "").trim().toUpperCase() === contestName;
      });
      if (contest) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        window.BATZO_ACTIVE_CONTEST = contest;
        window.dispatchEvent(new CustomEvent("batzo:contest", { detail: { contest: contest } }));
        return;
      }
    }

    var normalNav = event.target.closest && event.target.closest(".bottom-navigation button");
    if (normalNav) {
      var labelNode = normalNav.querySelector("small");
      var label = String(labelNode ? labelNode.textContent : "").trim().toUpperCase();
      if (label === "CONTEST") {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        openContestFlow();
        return;
      }
      if (label === "MY TEAM") {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        window.dispatchEvent(new CustomEvent("batzo:team", { detail: { match: readMatch() } }));
      }
    }
  }, true);

  document.addEventListener("click", function (event) {
    var matchButton = event.target.closest && event.target.closest(".upcoming-card,.bz-score-list-row");
    if (!matchButton || !/VIEW\s+CONTESTS/i.test(matchButton.textContent || "")) return;
    setTimeout(function () {
      if (readMatch()) openContestFlow();
    }, 40);
  }, false);

  var scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      topAndFlags();
      queuedTab();
    }, 0);
  }

  new MutationObserver(scheduleSync).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleSync, { once: true });
  } else {
    scheduleSync();
  }
})();
