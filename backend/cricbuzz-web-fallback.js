const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language":
    "en-US,en;q=0.9",
  Referer:
    "https://www.cricbuzz.com/"
};

const URLS = {
  live:
    "https://www.cricbuzz.com/cricket-match/live-scores",

  upcoming:
    "https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches",

  recent:
    "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches"
};

let cache = {
  time: 0,
  data: null
};

let pending = null;

function clean(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortName(name) {
  const words =
    clean(name)
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "TEAM";
  }

  if (words.length === 1) {
    return words[0]
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase();
  }

  return words
    .map((x) => x[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

function teamNamesFromTitle(title) {
  const value =
    clean(title)
      .replace(/\s+LIVE\s+/i, " ");

  const match =
    value.match(
      /^(.+?)\s+vs\s+(.+?)(?=,\s*|\s+\d+(?:st|nd|rd|th)\s+Match|\s+Match\s+\d+|\s+Final\b|\s+Semi[- ]?Final\b|\s+Qualifier\b|\s+Eliminator\b|$)/i
    );

  if (match) {
    return [
      clean(match[1]),
      clean(match[2])
    ];
  }

  const basic =
    value.split(/\s+vs\s+/i);

  if (basic.length >= 2) {
    return [
      clean(basic[0]),
      clean(
        basic[1]
          .split(",")[0]
      )
    ];
  }

  return [
    "Team A",
    "Team B"
  ];
}

function timestampFromCard($, card) {
  let value = "";

  $(card)
    .find("[data-timestamp]")
    .each((_, el) => {
      if (!value) {
        value =
          $(el).attr(
            "data-timestamp"
          ) || "";
      }
    });

  if (!value) {
    return "";
  }

  const number =
    Number(value);

  if (
    Number.isFinite(number)
  ) {
    const milliseconds =
      number > 100000000000
        ? number
        : number * 1000;

    const date =
      new Date(milliseconds);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toISOString();
    }
  }

  const parsed =
    Date.parse(value);

  return Number.isNaN(parsed)
    ? ""
    : new Date(parsed)
        .toISOString();
}

function seriesFromCard($, card) {
  const direct =
    clean(
      $(card)
        .closest(
          ".cb-col-100"
        )
        .find(
          ".cb-lv-grn-strip"
        )
        .first()
        .text()
    );

  if (direct) {
    return direct;
  }

  const parent =
    $(card).parent();

  const previous =
    clean(
      parent
        .prevAll(
          ".cb-lv-grn-strip"
        )
        .first()
        .text()
    );

  if (previous) {
    return previous;
  }

  const previous2 =
    clean(
      parent
        .parent()
        .prevAll(
          ".cb-lv-grn-strip"
        )
        .first()
        .text()
    );

  return (
    previous2 ||
    "Cricket"
  );
}

function parseScore(value, team) {
  const raw =
    clean(value);

  if (!raw) {
    return null;
  }

  const matches =
    [
      ...raw.matchAll(
        /(\d+)(?:-(\d+)|\/(\d+))?(?:\s*\((\d+(?:\.\d+)?)\))?/g
      )
    ];

  if (!matches.length) {
    return null;
  }

  const row =
    matches[
      matches.length - 1
    ];

  return {
    r: Number(
      row[1] || 0
    ),

    w: Number(
      row[2] ||
      row[3] ||
      0
    ),

    o:
      row[4] != null
        ? Number(row[4])
        : undefined,

    inning:
      `${team} Inning`
  };
}


/* BATZO_CRICBUZZ_DETAIL_TIME_V1 */

const detailCache = new Map();

function parseCricbuzzGMT(textValue) {
  const value =
    clean(textValue);

  /*
   * Example:
   * Match starts at Sep 08, 07:30 GMT
   */
  const m =
    value.match(
      /Match starts at\s+([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})\s+GMT/i
    );

  if (!m) {
    return "";
  }

  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  };

  const month =
    monthMap[
      m[1][0].toUpperCase() +
      m[1].slice(1,3).toLowerCase()
    ];

  if (month == null) {
    return "";
  }

  const now =
    new Date();

  let year =
    now.getUTCFullYear();

  const day =
    Number(m[2]);

  const hour =
    Number(m[3]);

  const minute =
    Number(m[4]);

  let date =
    new Date(
      Date.UTC(
        year,
        month,
        day,
        hour,
        minute,
        0
      )
    );

  /*
   * Handle year-boundary fixtures.
   */
  const diff =
    date.getTime() -
    now.getTime();

  if (
    diff <
      -180 *
      24 *
      60 *
      60 *
      1000
  ) {
    year += 1;

    date =
      new Date(
        Date.UTC(
          year,
          month,
          day,
          hour,
          minute,
          0
        )
      );
  }

  return date.toISOString();
}

async function fetchMatchDateTime(match) {
  if (
    !match ||
    !match.providerUrl
  ) {
    return match;
  }

  const key =
    match.providerUrl;

  const cached =
    detailCache.get(key);

  if (
    cached &&
    Date.now() -
      cached.time <
      6 * 60 * 60 * 1000
  ) {
    return {
      ...match,
      ...cached.value
    };
  }

  try {
    const response =
      await axios.get(
        key,
        {
          headers: HEADERS,
          timeout: 15000,
          maxRedirects: 5
        }
      );

    const $ =
      cheerio.load(
        response.data
      );

    const pageText =
      clean(
        $("body").text()
      );

    let dateTimeGMT =
      parseCricbuzzGMT(
        pageText
      );

    /*
     * Fallback for embedded timestamp,
     * if Cricbuzz exposes one.
     */
    if (!dateTimeGMT) {
      let stamp = "";

      $("[data-timestamp]")
        .each(
          (_, el) => {
            if (!stamp) {
              stamp =
                $(el).attr(
                  "data-timestamp"
                ) || "";
            }
          }
        );

      if (stamp) {
        const number =
          Number(stamp);

        if (
          Number.isFinite(number)
        ) {
          const ms =
            number >
            100000000000
              ? number
              : number * 1000;

          const d =
            new Date(ms);

          if (
            !Number.isNaN(
              d.getTime()
            )
          ) {
            dateTimeGMT =
              d.toISOString();
          }
        }
      }
    }

    const venueMatch =
      pageText.match(
        /Venue:\s*(.+?)\s*(?:Date\s*&\s*Time:|Date & Time:)/i
      );

    const venue =
      venueMatch
        ? clean(
            venueMatch[1]
          )
        : match.venue || "";

    const value = {
      dateTimeGMT:
        dateTimeGMT ||
        match.dateTimeGMT ||
        "",

      venue
    };

    detailCache.set(
      key,
      {
        time: Date.now(),
        value
      }
    );

    return {
      ...match,
      ...value
    };

  } catch (error) {
    console.warn(
      "CRICBUZZ DETAIL TIME:",
      match.providerMatchId ||
      "",
      error.response?.status ||
      error.message
    );

    return match;
  }
}

async function enrichDateTimes(matches, limit = 36) {
  const list =
    Array.isArray(matches)
      ? matches
      : [];

  const head =
    list.slice(0, limit);

  const tail =
    list.slice(limit);

  const result = [];

  const concurrency = 6;

  for (
    let i = 0;
    i < head.length;
    i += concurrency
  ) {
    const chunk =
      head.slice(
        i,
        i + concurrency
      );

    const enriched =
      await Promise.all(
        chunk.map(
          fetchMatchDateTime
        )
      );

    result.push(
      ...enriched
    );
  }

  return [
    ...result,
    ...tail
  ];
}

function parsePage(html, mode) {
  const $ =
    cheerio.load(html);

  let cards =
    $(
      "div.cb-scr-wll-chvrn.cb-lv-scrs-col"
    );

  if (!cards.length) {
    cards =
      $(
        "div.cb-lv-scrs-col"
      );
  }

  const result = [];
  const seen =
    new Set();

  cards.each(
    (_, card) => {
      let link =
        $(card)
          .find(
            'a[href*="/live-cricket-scores/"]'
          )
          .first();

      if (!link.length) {
        return;
      }

      const href =
        clean(
          link.attr("href")
        );

      const idMatch =
        href.match(
          /\/live-cricket-scores\/(\d+)/
        );

      if (!idMatch) {
        return;
      }

      const id =
        idMatch[1];

      if (seen.has(id)) {
        return;
      }

      seen.add(id);

      const cardText =
        clean(
          $(card).text()
        );

      let title =
        clean(
          link.attr("title")
        );

      if (!title) {
        title =
          clean(
            $(card)
              .find(
                ".cb-lv-scr-mtch-hdr"
              )
              .first()
              .text()
          );
      }

      if (!title) {
        title =
          clean(
            link.text()
          );
      }

      if (!title) {
        title =
          cardText;
      }

      const names =
        $(card)
          .find(
            ".cb-hmscg-tm-nm"
          )
          .map(
            (_, el) =>
              clean(
                $(el).text()
              )
          )
          .get()
          .filter(Boolean);

      const fromTitle =
        teamNamesFromTitle(
          title
        );

      const teamA =
        names[0] ||
        fromTitle[0];

      const teamB =
        names[1] ||
        fromTitle[1];

      const series =
        seriesFromCard(
          $,
          card
        );

      const statusText =
        clean(
          $(card)
            .find(
              ".cb-text-live,.cb-text-complete,.cb-text-preview,.cb-text-stumps,.cb-text-inprogress"
            )
            .last()
            .text()
        );

      const scoreCandidates =
        $(card)
          .find(
            ".cb-col-33,.cb-col-50,.cb-ovr-flo"
          )
          .map(
            (_, el) =>
              clean(
                $(el).text()
              )
          )
          .get()
          .filter(
            (x) =>
              /\d/.test(x)
          );

      const scores = [];

      if (
        scoreCandidates[0]
      ) {
        const parsed =
          parseScore(
            scoreCandidates[0],
            teamA
          );

        if (parsed) {
          scores.push(parsed);
        }
      }

      if (
        scoreCandidates[1]
      ) {
        const parsed =
          parseScore(
            scoreCandidates[1],
            teamB
          );

        if (parsed) {
          scores.push(parsed);
        }
      }

      const started =
        mode === "live" ||
        mode === "recent";

      const ended =
        mode === "recent";

      const status =
        statusText ||
        (
          mode === "live"
            ? "LIVE"
            : mode ===
              "upcoming"
              ? "Upcoming"
              : "Completed"
        );

      result.push({
        id:
          `cricbuzz-web:${id}`,

        provider:
          "cricbuzz-web",

        providerMatchId:
          String(id),

        providerUrl:
          "https://www.cricbuzz.com" +
          href,

        name:
          `${teamA} vs ${teamB}, ${title}, ${series}`,

        matchType:
          "cricket",

        status,

        venue: "",

        dateTimeGMT:
          timestampFromCard(
            $,
            card
          ),

        teams: [
          teamA,
          teamB
        ],

        teamInfo: [
          {
            name: teamA,
            shortname:
              shortName(
                teamA
              ),
            img: ""
          },
          {
            name: teamB,
            shortname:
              shortName(
                teamB
              ),
            img: ""
          }
        ],

        score: scores,

        seriesName:
          series,

        matchStarted:
          started,

        matchEnded:
          ended,

        webSource:
          "CRICBUZZ"
      });
    }
  );

  /*
   * Safety fallback:
   * in case Cricbuzz changes the card wrapper,
   * still discover match links from the page.
   */
  if (!result.length) {
    $(
      'a[href*="/live-cricket-scores/"]'
    ).each(
      (_, el) => {
        const href =
          clean(
            $(el).attr(
              "href"
            )
          );

        const idMatch =
          href.match(
            /\/live-cricket-scores\/(\d+)/
          );

        if (!idMatch) {
          return;
        }

        const id =
          idMatch[1];

        if (seen.has(id)) {
          return;
        }

        const title =
          clean(
            $(el).attr(
              "title"
            )
          ) ||
          clean(
            $(el).text()
          );

        if (
          !/\bvs\b/i.test(
            title
          )
        ) {
          return;
        }

        seen.add(id);

        const [
          teamA,
          teamB
        ] =
          teamNamesFromTitle(
            title
          );

        result.push({
          id:
            `cricbuzz-web:${id}`,

          provider:
            "cricbuzz-web",

          providerMatchId:
            String(id),

          providerUrl:
            "https://www.cricbuzz.com" +
            href,

          name:
            `${teamA} vs ${teamB}, ${title}`,

          matchType:
            "cricket",

          status:
            mode === "live"
              ? "LIVE"
              : mode ===
                "upcoming"
                ? "Upcoming"
                : "Completed",

          venue: "",

          dateTimeGMT: "",

          teams: [
            teamA,
            teamB
          ],

          teamInfo: [
            {
              name: teamA,
              shortname:
                shortName(
                  teamA
                ),
              img: ""
            },
            {
              name: teamB,
              shortname:
                shortName(
                  teamB
                ),
              img: ""
            }
          ],

          score: [],

          seriesName:
            "Cricket",

          matchStarted:
            mode !==
            "upcoming",

          matchEnded:
            mode ===
            "recent",

          webSource:
            "CRICBUZZ"
        });
      }
    );
  }

  return result;
}

async function fetchPage(
  url,
  mode
) {
  const response =
    await axios.get(
      url,
      {
        headers: HEADERS,
        timeout: 20000,
        maxRedirects: 5
      }
    );

  return parsePage(
    response.data,
    mode
  );
}

async function getCricbuzzWebData() {
  if (
    cache.data &&
    Date.now() -
      cache.time <
      90 * 1000
  ) {
    return cache.data;
  }

  if (pending) {
    return pending;
  }

  pending =
    (async () => {
      const settled =
        await Promise.allSettled([
          fetchPage(
            URLS.live,
            "live"
          ),
          fetchPage(
            URLS.upcoming,
            "upcoming"
          ),
          fetchPage(
            URLS.recent,
            "recent"
          )
        ]);

      const live =
        settled[0].status ===
        "fulfilled"
          ? settled[0].value
          : [];

      const upcoming =
        settled[1].status ===
        "fulfilled"
          ? settled[1].value
          : [];

      const recent =
        settled[2].status ===
        "fulfilled"
          ? settled[2].value
          : [];

      /*
       * Enrich visible cards with exact
       * Cricbuzz match-detail date/time.
       */
      const [
        liveTimed,
        upcomingTimed,
        recentTimed
      ] =
        await Promise.all([
          enrichDateTimes(
            live,
            30
          ),
          enrichDateTimes(
            upcoming,
            40
          ),
          enrichDateTimes(
            recent,
            40
          )
        ]);

      const data = {
        live: liveTimed,
        upcoming: upcomingTimed,
        recent: recentTimed
      };

      cache = {
        time:
          Date.now(),
        data
      };

      console.log(
        "CRICBUZZ WEB:",
        "LIVE=" +
          live.length,
        "UPCOMING=" +
          upcoming.length,
        "RECENT=" +
          recent.length
      );

      return data;
    })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

module.exports = {
  getCricbuzzWebData
};
