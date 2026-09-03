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
  if (typeof window !== "undefined" && window.__BATZO_NAV_CONTROLLER_ACTIVE__) {
    return;
  }
  if (typeof window !== "undefined") {
    window.__BATZO_NAV_CONTROLLER_ACTIVE__ = true;
  }
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
    async () => {
      try {
        /*
         * BATZO ANDROID BACK — SINGLE CENTRAL HANDLER
         *
         * Never allow Android Back to close the WebView while
         * BATZO is on an internal screen.
         */

        // 1. Dynamic contest/team screens first.
        if (handleDynamicBack()) {
          return;
        }

        // 2. React tab/navigation history.
        if (backScreen()) {
          return;
        }

        /*
         * 3. If React navigation is currently on a non-home tab,
         *    force Home instead of allowing Android to close the app.
         */
        if (typeof setTab === "function") {
          setTab("home");
          try {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (_) {}
          return;
        }

        /*
         * IMPORTANT:
         * Do NOT call window.history.back().
         * Do NOT call App.exitApp().
         * Do NOT allow the WebView to close from this handler.
         */
        return;
      } catch (error) {
        console.warn("[BATZO] Android Back:", error);
        return;
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
