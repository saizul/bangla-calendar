# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-16

### Added

- Gregorian to Bangla and Bangla to Gregorian conversion with the revised
  Bangladesh calendar (Bangla Academy, from 1426 BS): Boishakh to Ashwin 31
  days, Kartik to Magh and Choitro 30, Falgun 29 or 30 in a leap year,
  Pohela Boishakh on 14 April.
- `pre-2019` and `historical` variants for the previous rules (Falgun 30 or
  31 days, five 31-day months).
- `toBangla()` for Date objects, timestamps (read in Asia/Dhaka by default,
  or UTC, local or a fixed offset), ISO strings and plain objects;
  `toGregorian()`; `today()`.
- Month, weekday, season (ritu) and era names in Bangla, romanised Bangla
  and English; Bangla digits.
- `formatBangla()` with tokens (`YYYY`, `MMMM`, `Do`, `dddd`, `R`, `E`, ...)
  and Bangla ordinals.
- `parseBanglaDate()` for Bangla and romanised strings with spelling
  variants, ordinals, weekday checks, era words and numeric forms, without
  `String#normalize`.
- Date arithmetic, validation, month grids and a text month view, and the
  national days fixed by the revision.
- `bangla-calendar` CLI with `today`, `convert`, `--to-gregorian`, `month`
  and `events`, text or JSON output.
- ESM and CommonJS builds with type declarations; no runtime dependencies
  and no use of `Intl`.

[Unreleased]: https://github.com/saizul/bangla-calendar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/saizul/bangla-calendar/releases/tag/v0.1.0
