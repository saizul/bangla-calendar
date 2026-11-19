# bangla-calendar

[![CI](https://github.com/saizul/bangla-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/saizul/bangla-calendar/actions/workflows/ci.yml)
![Node 20+](https://img.shields.io/badge/node-20%2B-blue)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

The Bangla calendar (Bongabdo, বঙ্গাব্দ) of Bangladesh for JavaScript and
TypeScript. Convert between Gregorian and Bangla dates with the revised
Bangla Academy rules, format and parse Bangla dates, and get month, weekday
and season (ritu) names in Bangla, romanised Bangla or English. It does not
use `Intl`, `Date` arithmetic or `String#normalize`, so it gives the same
answer in Node, browsers, Deno, Bun, edge runtimes and React Native. Zero
dependencies, tree-shakable ESM and CommonJS, full type declarations, and a
CLI.

```js
import { toBangla, formatBangla, toGregorian, today } from '@saizul/bangla-calendar';

formatBangla(toBangla('2026-04-14'));                  // '১ বৈশাখ ১৪৩৩'
formatBangla(toBangla('2026-02-21'), 'Do MMMM YYYY');  // '৮ই ফাল্গুন ১৪৩২'
formatBangla(today(), 'dddd, D MMMM YYYY E, R');       // 'সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত'
toGregorian('১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ');                // { year: 2026, month: 4, day: 14 }
formatBangla(toBangla('2026-12-16'), 'D MMMM YYYY E', { locale: 'en' }); // '1 Poush 1433 BS'
```

```console
$ bangla-calendar today
সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত
$ bangla-calendar convert 2026-11-16 --en
Monday, 1 Ogrohayon 1433 BS, Late autumn
$ bangla-calendar convert --to-gregorian "১ বৈশাখ ১৪৩৩"
2026-04-14 (মঙ্গলবার)
```

## The calendar rules

Bangladesh uses a solar Bangla calendar with fixed month lengths. Bangla
Academy revised it in 2019, starting with the year 1426 BS:

| Month | বাংলা | Days (revised, from 1426) | Days (previous, until 1425) | Starts on (revised) |
| --- | --- | --- | --- | --- |
| Boishakh | বৈশাখ | 31 | 31 | 14 April |
| Joishtho | জ্যৈষ্ঠ | 31 | 31 | 15 May |
| Asharh | আষাঢ় | 31 | 31 | 15 June |
| Srabon | শ্রাবণ | 31 | 31 | 16 July |
| Bhadro | ভাদ্র | 31 | 31 | 16 August |
| Ashwin | আশ্বিন | **31** | 30 | 16 September |
| Kartik | কার্তিক | 30 | 30 | 17 October |
| Ogrohayon | অগ্রহায়ণ | 30 | 30 | 16 November |
| Poush | পৌষ | 30 | 30 | 16 December |
| Magh | মাঘ | 30 | 30 | 15 January |
| Falgun | ফাল্গুন | **29, or 30 in a leap year** | 30, or 31 in a leap year | 14 February |
| Choitro | চৈত্র | 30 | 30 | 15 March |

- The year always starts on **14 April** (Pohela Boishakh). Bangla year `Y`
  starts in Gregorian year `Y + 593`, so 14 April 2026 is 1 Boishakh 1433.
- Falgun of year `Y` covers February and early March of Gregorian year
  `Y + 594`, and it gets the extra day when that Gregorian year is a leap year
  (Falgun 1426 had 30 days because 2020 was a leap year). This is the only
  leap rule that keeps every Pohela Boishakh on 14 April and 1 Choitro on 15
  March, and it follows the Gregorian century rule (Falgun 1506, in 2100, has
  29 days).
- The revision makes national days fall on the same Bangla date every year:
  21 February is 8 Falgun, 26 March is 12 Choitro, 16 December is 1 Poush,
  8 May is 25 Boishakh, 25 May is 11 Joishtho and 14 February is 1 Falgun.
  Under the previous calendar 21 February fell on 9 Falgun and Pohela Falgun
  on 13 February.

### Sources

The rules were checked against these sources (all read in November 2026):

- Bangla Academy figures reported on the Ministry of Education teachers'
  portal, 16 October 2019:
  [বাংলা দিনপঞ্জি বদল](https://www.teachers.gov.bd/content/details/493103)
  (first six months 31 days, Kartik to Magh and Choitro 30, Falgun 29 and 30
  in a leap year, Ashwin 31 days from 1426, and the national days above).
- The Financial Express, October 2019:
  [Govt revises Bangla calendar to match national days with West](https://thefinancialexpress.com.bd/national/govt-revises-bangla-calendar-to-match-national-days-with-west-1571292255)
  (the public administration ministry circular, the Bangla Academy committee
  and the national-day dates).
- Dhaka Tribune, 22 October 2019:
  [Ashshin in 31 days in revised Bangla calendar](https://www.dhakatribune.com/bangladesh/191106/ashshin-in-31-days-in-revised-bangla-calendar).
- Prothom Alo, 16 April 2017:
  [আরেক দফা সংস্কার হচ্ছে বাংলা বর্ষপঞ্জি](https://www.prothomalo.com/bangladesh/article/1146656)
  (the previous rules: Falgun as the leap month with 30 or 31 days, and
  21 February on 9 Falgun).
- The Daily Star, 13 February 2020:
  [Pahela Falgun, Valentine's Day: '2 days' in 24 hours](https://www.thedailystar.net/frontpage/news/two-days-24-hours-1867597)
  (both month-length tables, and Pohela Falgun on 14 February from now on).
- Wikipedia: [Bangladeshi national calendar](https://en.wikipedia.org/wiki/Bangladeshi_national_calendar)
  (month start dates, and Kartik 1426 starting on Thursday 17 October 2019);
  Banglapedia: [Bangabda](https://en.banglapedia.org/index.php/Bangabda)
  (background of the 1966 reform committee).

None of the sources states the leap rule as a formula. The rule above is the
one that matches every published fact: Pohela Boishakh fixed on 14 April,
Falgun 1426 with 30 days in 2020, and the fixed national days.

The sources disagree on some history. The Daily Star article says Pohela
Falgun had fallen on 14 February in some earlier years, while the published
previous rules put it on 13 February; the `pre-2019` variant follows the
published rules. Sources also differ on when the previous rules were adopted
(1987 or the mid-1990s).

### West Bengal and other regional calendars

**Not supported.** The calendar used in West Bengal, Tripura and Assam is
based on the sidereal sun (Surya Siddhanta tradition): a month starts when the
sun enters a zodiac sign, so month lengths change from year to year and
Pohela Boishakh falls on 14 or 15 April. Converting it correctly needs
astronomical computation or published almanac (panjika) tables, and I could
not verify an exact algorithm from an authoritative source, so the package
leaves it out instead of guessing. The religious and lunar dates used for
festivals are also out of scope.

### Calendar variants

| Variant | Rules |
| --- | --- |
| `revised` (default) | The 2019 rules for every year, past and future. |
| `pre-2019` | The previous rules for every year. |
| `historical` | The previous rules until 1425 BS, the revised rules from 1426 BS. Use it for dates printed on documents before 2019. The two rule sets agree from 1 Boishakh to 31 Bhadro, so 1426 is consistent either way. |

```js
toBangla('2018-02-21', { variant: 'historical' }); // 9 Falgun 1424
toBangla('2018-02-21');                             // 8 Falgun 1424 (revised rules applied backwards)
```

## Time zone

A `Date` or a timestamp is an instant, not a calendar day. By default the
library reads instants in **Asia/Dhaka (UTC+06:00)**, so `today()` and
`toBangla(new Date())` give the date in Bangladesh no matter where the code
runs. Bangladesh has no daylight saving time today (a short-lived one in 2009
is not modelled). Pass `zone` to change this:

```js
const instant = Date.UTC(2026, 3, 13, 18, 30); // 00:30 on 14 April in Dhaka
toBangla(instant).day;                    // 1  (Asia/Dhaka, the default)
toBangla(instant, { zone: 'UTC' }).day;   // 30 (still 13 April in UTC)
toBangla(instant, { zone: 330 }).day;     // 1  (a fixed offset in minutes, here India)
toBangla(new Date(), { zone: 'local' });  // the runtime's local time zone
```

Strings like `'2026-04-14'` and `{ year, month, day }` objects are calendar
dates and are never shifted.

Traditionally the Bangla day begins at sunrise. Like the official calendar,
this library changes the date at midnight.

## Features

- Gregorian to Bangla and back for Bangla years 1 to 9999, using integer day
  arithmetic on the proleptic Gregorian calendar.
- `revised`, `pre-2019` and `historical` rule sets.
- Month, weekday, season and era names in Bangla (`bn`), romanised Bangla
  (`bn-Latn`) and English (`en`; months stay romanised because they have no
  English names).
- The six seasons: গ্রীষ্ম, বর্ষা, শরৎ, হেমন্ত, শীত, বসন্ত.
- Bangla digits both ways.
- Formatting with tokens, including Bangla ordinals (১লা, ২রা, ৪ঠা, ৮ই,
  ২১শে).
- Parsing Bangla and romanised date strings with spelling variants, ordinals,
  weekdays (checked against the date), era words and numeric forms. Nukta
  letters in either Unicode form and zero-width joiners are handled without
  `String#normalize`.
- Date arithmetic: `addDays`, `addMonths`, `diffDays`, `compareBangla`.
- Month grids and a text month view, and the national days fixed by the
  revision.
- iCalendar (`.ics`) export of every Bangla day and the national days, to
  subscribe to or import into Google Calendar, Apple Calendar or Outlook.

## Install

The package is published to GitHub Packages as `@saizul/bangla-calendar`.
Tell npm where to find the `@saizul` scope by adding this line to an `.npmrc`
file in your project (or in your home directory):

```ini
@saizul:registry=https://npm.pkg.github.com
```

GitHub Packages needs a token to install, even for public packages. Create a
personal access token with the `read:packages` scope, expose it as
`NODE_AUTH_TOKEN`, and reference it from `.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
npm install @saizul/bangla-calendar
npm install --global @saizul/bangla-calendar   # for the CLI
```

The library runs on any ES2022 runtime. The CLI needs Node 20 or newer.

## Usage

### Converting

```js
import { toBangla, toGregorian, gregorianToBangla, banglaToGregorian } from '@saizul/bangla-calendar';

toBangla('2026-11-16');
// { year: 1433, month: 8, day: 1, weekday: 1, dayOfYear: 217, season: 3, leapYear: false }

toBangla(new Date());                       // read in Asia/Dhaka
toBangla({ year: 2026, month: 12, day: 16 });

toGregorian({ year: 1433, month: 1, day: 1 }); // { year: 2026, month: 4, day: 14 }
toGregorian('৮ই ফাল্গুন ১৪৩২');                 // { year: 2026, month: 2, day: 21 }

// The core functions take plain objects only:
gregorianToBangla({ year: 2026, month: 4, day: 14 });
banglaToGregorian({ year: 1433, month: 1, day: 1 });
```

Months are numbered 1 (Boishakh) to 12 (Choitro), weekdays 0 (Sunday,
রবিবার) to 6 (Saturday), seasons 0 (গ্রীষ্ম) to 5 (বসন্ত). Invalid dates throw a
`RangeError`: `toGregorian({ year: 1433, month: 11, day: 30 })` throws because
Falgun 1433 has 29 days.

### Formatting

```js
import { formatBangla } from '@saizul/bangla-calendar';

const d = toBangla('2026-02-21');
formatBangla(d);                                        // '৮ ফাল্গুন ১৪৩২'
formatBangla(d, 'dddd, Do MMMM YYYY E');                // 'শনিবার, ৮ই ফাল্গুন ১৪৩২ বঙ্গাব্দ'
formatBangla(d, 'DD-MM-YYYY');                          // '০৮-১১-১৪৩২'
formatBangla(d, '[ঋতু:] R');                            // 'ঋতু: বসন্ত'
formatBangla(d, 'D MMMM YYYY', { digits: 'latn' });     // '8 ফাল্গুন 1432'
formatBangla(d, 'dddd, Do MMMM YYYY E', { locale: 'en' });      // 'Saturday, 8th Falgun 1432 BS'
formatBangla(d, 'dddd, D MMMM YYYY E', { locale: 'bn-Latn' });  // 'Shonibar, 8 Falgun 1432 Bongabdo'
```

| Token | `bn` | `en` | Meaning |
| --- | --- | --- | --- |
| `YYYY` | ১৪৩২ | 1432 | year |
| `YY` | ৩২ | 32 | last two digits of the year |
| `MMMM` | ফাল্গুন | Falgun | month name |
| `MM` / `M` | ১১ / ১১ | 11 / 11 | month number, padded / plain |
| `Do` | ৮ই | 8th | day with ordinal suffix |
| `DD` / `D` | ০৮ / ৮ | 08 / 8 | day, padded / plain |
| `dddd` / `ddd` | শনিবার / শনি | Saturday / Sat | weekday |
| `d` | ৬ | 6 | weekday number, 0 = Sunday |
| `R` | বসন্ত | Spring | season (ritu) |
| `E` | বঙ্গাব্দ | BS | era (`Bongabdo` in `bn-Latn`) |
| `[text]` | text | text | literal text |

Any other character is copied as it is, so put words in brackets: `[তারিখ] D`.

### Parsing

```js
import { parseBanglaDate, tryParseBanglaDate } from '@saizul/bangla-calendar';

parseBanglaDate('১ বৈশাখ ১৪৩৩');               // { year: 1433, month: 1, day: 1 }
parseBanglaDate('মঙ্গলবার, ১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ');
parseBanglaDate('Baishakh 1, 1433 B.S.');
parseBanglaDate('1st Boishakh 1433');
parseBanglaDate('১৪৩৩-০১-০১');                  // year-month-day
parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩৩');         // throws: 1 Boishakh 1433 is a Tuesday
tryParseBanglaDate('১৪ এপ্রিল ২০২৬');            // undefined (a Gregorian month name)
```

Month names are matched with common spelling variants (Baishakh, Boishakh,
Boisakh; Jyoishtho, Jaistha; Agrahayan, Ogrohayon, অঘ্রাণ; Phalgun, Falgun,
ফাগুন; Chaitra, Choitro and more). Unknown words are rejected, not ignored.

### Today, months and national days

```js
import { today, monthGrid, renderMonth, eventsInYear, eventsOn } from '@saizul/bangla-calendar';

today();                                    // in Asia/Dhaka
monthGrid(1433, 8).weeks[0];                // [null, 1, 2, 3, 4, 5, 6]
console.log(renderMonth(1433, 8, { highlight: 1 }));
eventsOn({ month: 11, day: 8 });            // [{ id: 'mother-language-day', ... }]
eventsInYear(1433).map((e) => e.gregorian); // Gregorian dates of the national days
```

## API

| Function | Description |
| --- | --- |
| `toBangla(input, { variant?, zone? })` | Date, timestamp, `YYYY-MM-DD` or `{ year, month, day }` to a `BanglaDate`. |
| `toGregorian(input, { variant? })` | `{ year, month, day }` or a Bangla date string to a Gregorian date. |
| `today({ zone?, now?, variant? })` | Today's `BanglaDate`. |
| `gregorianToBangla(date)`, `banglaToGregorian(date)` | The conversions on plain objects. |
| `daysToBangla(days)`, `banglaToDays(date)` | Conversions to and from day numbers (days since 1970-01-01). |
| `formatBangla(date, pattern?, { locale?, digits?, variant? })` (alias `format`) | Formatting. |
| `parseBanglaDate(text, { checkWeekday?, variant? })` (alias `parse`), `tryParseBanglaDate` | Parsing. |
| `isLeapYear(year)`, `daysInYear(year)`, `daysInMonth(year, month)`, `monthLengths(year)` | Year structure. |
| `isValidBanglaDate(date)`, `assertBanglaDate(date)` | Validation. |
| `addDays`, `addMonths`, `diffDays`, `compareBangla` | Arithmetic. |
| `monthName`, `weekdayName`, `seasonName`, `seasonOfMonth`, `eraName` | Names. |
| `MONTHS_BN`, `MONTHS_LATN`, `WEEKDAYS_*`, `SEASONS_*` | Name lists. |
| `toBanglaDigits`, `toLatinDigits`, `hasBanglaDigits` | Digits. |
| `banglaOrdinalSuffix(day)`, `englishOrdinalSuffix(day)` | Ordinal suffixes. |
| `monthGrid`, `renderMonth`, `displayWidth` | Month views. |
| `EVENTS`, `eventsOn`, `eventsInYear` | National days fixed by the revision. |
| `toICalendar(year, { years?, include?, locale?, digits?, pattern?, name?, now?, variant? })` | iCalendar file with the days (`include: 'days'`), national days (`'events'`) or both (default) of one or more Bangla years. |
| `escapeICalText`, `foldICalLine` | iCalendar text escaping and 75-octet line folding (UTF-8 safe). |
| `daysFromCivil`, `civilFromDays`, `isGregorianLeapYear`, `parseIsoDate`, `formatIsoDate`, `weekdayFromDays` | Gregorian helpers. |
| `instantToDays(instant, zone)`, `DHAKA_OFFSET_MINUTES` | Time zone helpers. |

Every function is a separate named export, and the package sets
`"sideEffects": false`, so bundlers drop what you do not import.

## CLI

```console
$ bangla-calendar                          # same as "today"
সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত

$ bangla-calendar convert 2026-02-21 -f "dddd, Do MMMM YYYY"
শনিবার, ৮ই ফাল্গুন ১৪৩২

$ bangla-calendar convert --to-gregorian "১ বৈশাখ ১৪৩৩"
2026-04-14 (মঙ্গলবার)

$ bangla-calendar convert "1 Falgun 1424" --variant historical --en
2018-02-13 (Tuesday)

$ bangla-calendar convert 2026-11-16 --json
{ "bangla": { "year": 1433, "month": 8, "day": 1, ... }, "gregorian": "2026-11-16", ... }

$ bangla-calendar month 1433 1 --en
Boishakh 1433
 Sun Mon Tue Wed Thu Fri Sat
           1   2   3   4   5
   6   7   8   9  10  11  12
  ...

$ bangla-calendar events 1433
2026-04-14  ১ বৈশাখ ১৪৩৩  পহেলা বৈশাখ (বাংলা নববর্ষ)
2026-05-08  ২৫ বৈশাখ ১৪৩৩  রবীন্দ্র জয়ন্তী
...
```

### Calendar file

`ics` writes an iCalendar file with one all-day event per day of a Bangla
year, titled with its Bangla date, and the national days of that year. Import
it once, or publish it on a web server and subscribe to its URL:

```console
$ bangla-calendar ics 1433 > bangla-1433.ics          # every day and national day of 1433
$ bangla-calendar ics 1433 3 --events-only --en > national-days.ics
$ bangla-calendar ics --days-only -f "D MMMM" > this-year.ics
```

`[year]` defaults to the current Bangla year and `[count]` to one year.
`--format` sets the title of the daily events, `--locale` and `--digits`
their language. Event UIDs are stable (`bangla-1433-01-01@bangla-calendar`),
so re-importing a new file updates the events instead of duplicating them.
Lines are folded at 75 octets without splitting Bangla letters, as RFC 5545
requires.

Options: `--to-gregorian` / `-g`, `--locale bn|bn-Latn|en` (or `--en`),
`--digits bn|latn`, `--format <pattern>`, `--json`,
`--variant revised|pre-2019|historical`,
`--zone Asia/Dhaka|UTC|local|<minutes>`, `--week-start 0-6`, and
`--events-only` / `--days-only` for `ics`. Exit code 0 on
success and 2 on invalid input.

## Examples

- [`examples/basic.mjs`](examples/basic.mjs): today, conversions and leap years
- [`examples/english.mjs`](examples/english.mjs): romanised and English output, parsing variants
- [`examples/calendar-page.mjs`](examples/calendar-page.mjs): a month view with the national days
- [`examples/commonjs.cjs`](examples/commonjs.cjs): `require()` usage
- [`examples/browser.html`](examples/browser.html): use in a browser without a bundler

## Testing

```bash
npm ci
npm test              # builds ESM + CJS, compiles the tests, runs node:test
npm run lint          # biome lint + tsc --noEmit
npm run format:check  # biome format, no changes
```

The tests check:

- **Anchor dates** from the sources above in many years from 2019 to 2100:
  14 April = 1 Boishakh, 21 February = 8 Falgun, 26 March = 12 Choitro,
  16 December = 1 Poush, 14 February = 1 Falgun, 8 May = 25 Boishakh,
  25 May = 11 Joishtho, every month start in the published table, Kartik 1426
  starting on Thursday 17 October 2019, and 21 February = 9 Falgun under the
  previous rules.
- **Leap years**: Falgun has 30 days when its February has 29 days, including
  the century rule (2100 is not a leap year, 2000 and 2400 are).
- **Round trips** for every day from 1300 to 1600 BS in all three variants
  (with continuity of days, months, years and weekdays), and 20,000 random
  days across the whole range from 594 to 10593 CE.
- The Gregorian arithmetic against `Date.UTC` for every day from 1900 to 2100.
- Formatting and parsing round trips for every day of a leap and a common
  year in five patterns, nukta letters in both Unicode forms, joiners, and
  rejected input.
- That the library code uses no `Intl`, `String#normalize` or locale methods,
  and still works with `Intl` deleted.

CI runs on Node 20 and 22.

## Limitations

- **Bangladesh only.** The West Bengal (Indian) calendar is not supported;
  see above.
- **Before 2019** the `revised` default applies today's rules backwards. Use
  `historical` for dates from documents of that time. Before the previous
  rules were adopted, official dates followed older practice that the package
  does not model.
- **Midnight, not sunrise**, is the start of a day.
- **Fixed UTC+06:00** for Asia/Dhaka. Pass a different `zone` for other
  places; the `local` zone uses the runtime's own time zone data.
- **Gregorian only.** Dates before 1582 are proleptic Gregorian, not Julian.
- **National days** are limited to the dates the revision fixed. Religious
  holidays that follow lunar calendars are not included.
- **Month views** align Bangla text by counting combining marks; some
  terminals and fonts may still render the columns slightly unevenly.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md).
Security issues: see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) (c) 2026 Saizul Amin
