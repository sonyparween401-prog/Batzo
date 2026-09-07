from pathlib import Path

p = Path.home() / "Batzo/backend/cricbuzz-web-fallback.js"
s = p.read_text()

MARKER = "BATZO_CRICBUZZ_DETAIL_TIME_V1"

if MARKER not in s:

    anchor = '''function parsePage(html, mode) {'''

    if anchor not in s:
        raise SystemExit(
            "ERROR: parsePage anchor not found"
        )

    addition = r'''
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

'''

    s = s.replace(
        anchor,
        addition + anchor,
        1
    )

old = '''      const data = {
        live,
        upcoming,
        recent
      };'''

new = '''      /*
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
      };'''

if old not in s:
    raise SystemExit(
        "ERROR: data block not found"
    )

s = s.replace(
    old,
    new,
    1
)

p.write_text(s)

print("✅ CRICBUZZ DETAIL DATE/TIME ENRICHMENT ADDED")
