
(function () {
  "use strict";

  if (window.__BATZO_RUNTIME_FINAL_FIX__) return;
  window.__BATZO_RUNTIME_FINAL_FIX__ = true;

  var nativeFetch = window.fetch.bind(window);
  var apiPattern = /\/api\/cricket\/(matches|live|upcoming|completed)(?:\?|$)/i;
  var cachePrefix = "batzo_cricket_fast_cache_v2:";

  function cacheKey(url) {
    return cachePrefix + String(url).replace(/[?#].*$/, "");
  }

  /* Show cached matches immediately, refresh data in background */
  window.fetch = function (input, options) {
    var url = typeof input === "string" ? input : input && input.url;
    var method = String((options && options.method) || "GET").toUpperCase();

    if (!url || method !== "GET" || !apiPattern.test(url)) {
      return nativeFetch(input, options);
    }

    var key = cacheKey(url);
    var cached = null;

    try {
      cached = localStorage.getItem(key);
    } catch (_) {}

    if (cached) {
      nativeFetch(input, options)
        .then(function (response) {
          if (!response.ok) return;
          return response.clone().text().then(function (body) {
            try {
              localStorage.setItem(key, JSON.stringify({
                body: body,
                savedAt: Date.now(),
                contentType: response.headers.get("content-type") ||
                  "application/json"
              }));
            } catch (_) {}
          });
        })
        .catch(function () {});

      try {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.body) {
          return Promise.resolve(new Response(parsed.body, {
            status: 200,
            headers: {
              "Content-Type": parsed.contentType || "application/json",
              "X-Batzo-Cache": "HIT"
            }
          }));
        }
      } catch (_) {}
    }

    return nativeFetch(input, options).then(function (response) {
      if (response.ok) {
        response.clone().text().then(function (body) {
          try {
            localStorage.setItem(key, JSON.stringify({
              body: body,
              savedAt: Date.now(),
              contentType: response.headers.get("content-type") ||
                "application/json"
            }));
          } catch (_) {}
        });
      }
      return response;
    });
  };

  var countryFlags = [
    ["india", "🇮🇳"], ["ind", "🇮🇳"],
    ["australia", "🇦🇺"], ["aus", "🇦🇺"],
    ["england", "🏴"], ["eng", "🏴"],
    ["pakistan", "🇵🇰"], ["pak", "🇵🇰"],
    ["bangladesh", "🇧🇩"], ["ban", "🇧🇩"],
    ["new zealand", "🇳🇿"], ["nz", "🇳🇿"],
    ["south africa", "🇿🇦"], ["rsa", "🇿🇦"],
    ["sri lanka", "🇱🇰"], ["sl", "🇱🇰"],
    ["afghanistan", "🇦🇫"], ["afg", "🇦🇫"],
    ["west indies", "🏝️"], ["wi", "🏝️"],
    ["ireland", "🇮🇪"], ["ire", "🇮🇪"],
    ["zimbabwe", "🇿🇼"], ["zim", "🇿🇼"],
    ["nepal", "🇳🇵"], ["nep", "🇳🇵"],
    ["netherlands", "🇳🇱"], ["ned", "🇳🇱"],
    ["usa", "🇺🇸"], ["canada", "🇨🇦"],
    ["uae", "🇦🇪"], ["oman", "🇴🇲"],
    ["namibia", "🇳🇦"]
  ];

  function getTeamText(box) {
    var row = box.closest(
      ".bz-team-line,.bz-score-list-row,.up-team,.side-team,.team-row"
    );
    return String(
      (box.getAttribute("aria-label") || "") + " " +
      (box.getAttribute("title") || "") + " " +
      (row ? row.innerText || row.textContent || "" : "")
    ).toLowerCase();
  }

  function fallbackValue(box) {
    var text = getTeamText(box);

    for (var i = 0; i < countryFlags.length; i++) {
      var name = countryFlags[i][0];
      if (
        text.indexOf(name) !== -1 ||
        new RegExp("(^|\\s)" + name + "(\\s|$)", "i").test(text)
      ) {
        return countryFlags[i][1];
      }
    }

    var strong = box.parentElement &&
      box.parentElement.querySelector("strong");

    var code = String(strong ? strong.textContent : "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase();

    return code || "🏏";
  }

  function applyFallback(box, img) {
    if (!box || box.dataset.batzoFallbackDone === "1") return;

    box.dataset.batzoFallbackDone = "1";
    if (img) img.remove();

    var badge = document.createElement("span");
    badge.className = "batzo-team-fallback";
    badge.textContent = fallbackValue(box);
    box.appendChild(badge);
  }

  function repairLogos(root) {
    var scope = root && root.querySelectorAll ? root : document;

    scope.querySelectorAll(
      ".flag,.mini-flag,.bz-team-logo,.team-logo,.bz-team-flag"
    ).forEach(function (box) {
      var img = box.querySelector("img");

      if (!img) {
        if (!String(box.textContent || "").trim()) {
          applyFallback(box, null);
        }
        return;
      }

      if (img.dataset.batzoErrorReady !== "1") {
        img.dataset.batzoErrorReady = "1";
        img.addEventListener("error", function () {
          applyFallback(box, img);
        });
      }

      if (img.complete && img.naturalWidth === 0) {
        applyFallback(box, img);
      }
    });
  }

  function start() {
    repairLogos(document);

    new MutationObserver(function (changes) {
      changes.forEach(function (change) {
        change.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) repairLogos(node);
        });
      });
    }).observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setInterval(function () {
      repairLogos(document);
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
