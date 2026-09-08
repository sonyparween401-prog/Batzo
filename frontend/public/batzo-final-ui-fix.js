
(function () {
  const flags = {
    india:"🇮🇳",australia:"🇦🇺",pakistan:"🇵🇰",england:"🏴",
    rwanda:"🇷🇼",botswana:"🇧🇼",kenya:"🇰🇪",ghana:"🇬🇭",
    "sierra leone":"🇸🇱",uganda:"🇺🇬",tanzania:"🇹🇿",
    nigeria:"🇳🇬",namibia:"🇳🇦",nepal:"🇳🇵",canada:"🇨🇦",
    ireland:"🇮🇪",zimbabwe:"🇿🇼",bangladesh:"🇧🇩",
    afghanistan:"🇦🇫","sri lanka":"🇱🇰","south africa":"🇿🇦",
    "new zealand":"🇳🇿",oman:"🇴🇲",uae:"🇦🇪"
  };

  function top() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll(
      "#root,main,.app,.page,.content,.bz-flow-screen"
    ).forEach(function (el) {
      el.scrollTop = 0;
    });
  }

  function logos() {
    document.querySelectorAll(
      ".flag,.mini-flag,.bz-team-logo,.team-logo,.bz-team-flag"
    ).forEach(function (el) {
      const img = el.querySelector("img");

      if (img) {
        img.onerror = function () {
          img.remove();
          el.textContent = "🏏";
        };
      }

      if (!el.textContent.trim() && !el.querySelector("img")) {
        const text = String(el.parentElement?.innerText || "").toLowerCase();
        let icon = "🏏";

        Object.keys(flags).some(function (name) {
          if (text.includes(name)) {
            icon = flags[name];
            return true;
          }
          return false;
        });

        el.textContent = icon;
      }
    });
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest("button,a,[role='button']");
    if (!button) return;

    const text = String(button.innerText || "").toUpperCase();

    if (
      text.includes("CONTEST") ||
      text.includes("MY TEAM") ||
      text.includes("SAVE TEAM")
    ) {
      [0,100,300,600].forEach(function (delay) {
        setTimeout(function () {
          top();
          logos();
        }, delay);
      });
    }
  }, true);

  new MutationObserver(logos).observe(document.documentElement, {
    childList:true,
    subtree:true
  });

  document.addEventListener("DOMContentLoaded", function () {
    top();
    logos();
  });
})();
