import { App as CapacitorApp } from "@capacitor/app";

let screenStack = [];
let initialized = false;
let getTab = null;
let setTab = null;

function isVisible(el) {
  if (!el) return false;

  const style = window.getComputedStyle(el);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetParent !== null
  );
}

function visibleElement(id) {
  const el = document.getElementById(id);
  return isVisible(el) ? el : null;
}

export function pushScreen(screen) {
  if (!screen) return;

  const current = getTab ? getTab() : null;

  if (current && current !== screen) {
    if (screenStack[screenStack.length - 1] !== current) {
      screenStack.push(current);
    }
  }

  if (setTab) {
    setTab(screen);
  }
}

export function replaceScreen(screen) {
  if (!screen) return;

  if (screenStack.length) {
    screenStack[screenStack.length - 1] = screen;
  }

  if (setTab) {
    setTab(screen);
  }
}

export function backScreen() {
  if (screenStack.length > 0) {
    const previous = screenStack.pop();

    if (setTab) {
      setTab(previous);
    }

    return true;
  }

  const current = getTab ? getTab() : null;

  if (current && current !== "home") {
    if (setTab) {
      setTab("home");
    }

    return true;
  }

  return false;
}

export function clearNavigation() {
  screenStack = [];
}

function handleDynamicBack() {
  /*
   * Team Builder is dynamically rendered outside the React tab tree.
   * Its back target is the Contest screen.
   */
  const teamBack =
    visibleElement("bzBack");

  if (teamBack) {
    teamBack.click();
    return true;
  }

  /*
   * Contest dynamic screen returns to Matches.
   */
  const contestBack =
    visibleElement("bzContestBack");

  if (contestBack) {
    contestBack.click();
    return true;
  }

  /*
   * Additional known dynamic back buttons.
   */
  const dynamicBack =
    document.querySelector(
      '[data-batzo-back="contest"]'
    );

  if (isVisible(dynamicBack)) {
    dynamicBack.click();
    return true;
  }

  return false;
}

export function initBatzoNavigation(options = {}) {
  if (options.getTab) getTab = options.getTab;
  if (options.setTab) setTab = options.setTab;

  if (initialized) return;

  initialized = true;

  window.__BATZO_NAV_BACK__ = function () {
    if (handleDynamicBack()) return true;
    return backScreen();
  };

  window.__BATZO_PUSH_SCREEN__ = function (screen) {
    pushScreen(screen);
  };

  window.__BATZO_REPLACE_SCREEN__ = function (screen) {
    replaceScreen(screen);
  };

  window.__BATZO_CLEAR_NAV__ = function () {
    clearNavigation();
  };

  CapacitorApp.addListener(
    "backButton",
    async ({ canGoBack }) => {
      try {
        /*
         * FIRST: dynamically rendered Contest/Team screens.
         */
        if (handleDynamicBack()) {
          return;
        }

        /*
         * SECOND: React tab navigation.
         */
        if (backScreen()) {
          return;
        }

        /*
         * THIRD: normal WebView history.
         */
        if (
          canGoBack &&
          window.history.length > 1
        ) {
          window.history.back();
          return;
        }

        /*
         * Root screen: Android is allowed to exit.
         */
        console.log(
          "BATZO: ROOT SCREEN — ALLOW ANDROID EXIT"
        );
      } catch (error) {
        console.warn(
          "BATZO Android back controller:",
          error
        );
      }
    }
  );

  console.log(
    "BATZO PHASE 18 NAVIGATION CONTROLLER READY"
  );
}

export function getNavigationStack() {
  return [...screenStack];
}


export function recordScreen(screen) {
  if (!screen) return;

  const current = getTab ? getTab() : null;

  if (!current || current === screen) return;

  if (screenStack[screenStack.length - 1] !== current) {
    screenStack.push(current);
  }
}
