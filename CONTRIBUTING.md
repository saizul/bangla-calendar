# Contributing

Thanks for helping improve bangla-calendar. The most valuable contributions
are dates that come out wrong, with a source: a government holiday list, a
Bangla Academy calendar, or a newspaper date line.

## Reporting a wrong date

Open an issue with:

- the input, the output you got and the output you expected
- **a source for the expected date** (a link or a photo of a printed
  calendar). Calendar rules changed in 2019, so say which year the source is
  from
- the variant you used (`revised`, `pre-2019` or `historical`) and, for
  instants, the zone

For parsing problems, include the exact string. If it contains nukta letters
(ড় ঢ় য়) or joiners, the code points help:
`[...text].map((c) => c.codePointAt(0).toString(16))`.

## Development setup

You need Node 20 or newer.

```console
$ git clone https://github.com/saizul/bangla-calendar.git
$ cd bangla-calendar
$ npm ci
$ npm test              # builds ESM + CJS, compiles the tests and runs node:test
$ npm run lint          # biome lint + tsc --noEmit
$ npm run format        # biome format --write
$ npm run format:check  # what CI runs
```

## Guidelines

- **Zero runtime dependencies, no Intl.** The library must give the same
  result on every runtime, so it must not use `Intl`, `toLocale*`,
  `localeCompare` or `String#normalize`. A test enforces this.
- **Cite rule changes.** A change to month lengths, the leap rule or the
  national days needs an authoritative source (Bangla Academy, a government
  notice, or a reputable newspaper report of one), added to the Sources
  section of the README and to the comment at the top of
  `test/anchors.test.ts`.
- **Keep old behaviour available.** If official rules change again, add a
  variant rather than changing what an existing variant returns for past
  dates.
- **Write invisible characters as code points** in tests
  (`String.fromCharCode(0x09dc)`), so that precomposed and decomposed nukta
  letters are not confused.
- Every change comes with a test and a line in the `Unreleased` section of
  `CHANGELOG.md`.

## Project layout

```text
src/
  calendar.ts    month lengths, variants, leap years, conversion core
  gregorian.ts   Gregorian day arithmetic without Date
  convert.ts     toBangla, toGregorian, today, time zones
  format.ts      formatting tokens and ordinals
  parse.ts       parsing Bangla and romanised date strings
  names.ts       month, weekday, season and era names
  digits.ts      Bangla digits
  events.ts      national days fixed by the 2019 revision
  month-view.ts  month grids and text rendering
  cli.ts, cli/   command-line interface
test/            node:test suites
examples/        runnable scripts
```
