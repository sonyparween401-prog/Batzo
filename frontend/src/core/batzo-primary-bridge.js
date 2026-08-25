/*
 * BATZO PRIMARY UI BRIDGE
 *
 * This does not replace the existing screens.
 * It connects visible buttons to the existing event-based flows.
 */

(function () {

  function getMatchFromElement(el) {

    const text = (
      el?.closest(
        ".match-card,.match-card-container,.bz-match-card,article,section,div"
      )?.innerText || ""
    ).toUpperCase();

    if (text.includes("IND") && text.includes("AUS"))
      return "IND vs AUS";

    if (text.includes("IND") && text.includes("ENG"))
      return "IND vs ENG";

    return "IND vs AUS";
  }

  function openContest(match) {

    const detail = {
      match: match || "IND vs AUS"
    };

    window.dispatchEvent(
      new CustomEvent("batzo:open-primary-contest", {
        detail
      })
    );

    /*
     * Compatibility with existing contest systems.
     * If an existing listener is present, it can continue
     * handling the event without duplicating the UI.
     */
    window.dispatchEvent(
      new CustomEvent("batzo:contest", {
        detail: {
          match: match || "IND vs AUS"
        }
      })
    );
  }

  (()=>{})(
    "click",
    function (e) {

      const el = e.target.closest(
        "button,a,[role='button']"
      );

      if (!el) return;

      const text = (
        el.innerText ||
        el.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      if (
        text.includes("VIEW CONTESTS") ||
        text === "CONTESTS" ||
        text.includes("JOIN CONTEST")
      ) {

        const match = getMatchFromElement(el);

        /*
         * Do not interfere if a known React handler is already
         * handling the click. The event is still made available
         * to the primary bridge.
         */
        openContest(match);
      }

    },
    true
  );

  console.log(
    "BATZO PRIMARY FLOW BRIDGE READY"
  );

})();
