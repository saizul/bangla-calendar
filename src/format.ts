// Formatting Bangla dates with tokens such as `D MMMM YYYY`.

import {
  type BanglaDate,
  type BanglaDateParts,
  type CalendarOptions,
  banglaToDays,
  daysToBangla,
} from './calendar.js';
import { pad, toBanglaDigits } from './digits.js';
import { eraName, type Locale, monthName, seasonName, weekdayName } from './names.js';

export interface FormatOptions extends CalendarOptions {
  /** Names: `bn` (default), `bn-Latn` (romanised) or `en`. */
  locale?: Locale;
  /** Digits: `bn` (default for the `bn` locale) or `latn`. */
  digits?: 'bn' | 'latn';
}

/** The default pattern: `D MMMM YYYY`, for example ১ বৈশাখ ১৪৩৩. */
export const DEFAULT_PATTERN = 'D MMMM YYYY';

/** Pattern tokens, longest first so that `MMMM` wins over `MM`. */
export const FORMAT_TOKENS = [
  'YYYY',
  'YY',
  'MMMM',
  'MM',
  'M',
  'Do',
  'DD',
  'D',
  'dddd',
  'ddd',
  'd',
  'R',
  'E',
] as const;

const TOKEN_RE = /\[([^\]]*)\]|YYYY|YY|MMMM|MM|M|Do|DD|D|dddd|ddd|d|R|E/g;

/**
 * The Bangla ordinal suffix used when writing dates: ১লা, ২রা, ৩রা, ৪ঠা,
 * ৫ই ... ১৮ই, ১৯শে ... ৩১শে.
 */
export function banglaOrdinalSuffix(day: number): string {
  if (day === 1) return 'লা';
  if (day === 2 || day === 3) return 'রা';
  if (day === 4) return 'ঠা';
  if (day >= 5 && day <= 18) return 'ই';
  return 'শে';
}

/** English ordinal suffix: st, nd, rd, th. */
export function englishOrdinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function complete(date: BanglaDateParts | BanglaDate, options: CalendarOptions): BanglaDate {
  if ('weekday' in date && 'season' in date && typeof date.weekday === 'number') return date as BanglaDate;
  return daysToBangla(banglaToDays(date, options), options);
}

/**
 * Formats a Bangla date. Tokens:
 *
 * | Token | Output (bn) | Output (en) |
 * | --- | --- | --- |
 * | `YYYY` | ১৪৩৩ | 1433 |
 * | `YY` | ৩৩ | 33 |
 * | `MMMM` | বৈশাখ | Boishakh |
 * | `MM` / `M` | ০১ / ১ | 01 / 1 |
 * | `Do` | ১লা | 1st |
 * | `DD` / `D` | ০১ / ১ | 01 / 1 |
 * | `dddd` / `ddd` | মঙ্গলবার / মঙ্গল | Tuesday / Tue |
 * | `d` | ২ (0 = Sunday) | 2 |
 * | `R` | গ্রীষ্ম | Summer |
 * | `E` | বঙ্গাব্দ | BS |
 *
 * Text in square brackets is copied as it is: `[আজ] D MMMM`.
 */
export function formatBangla(
  date: BanglaDateParts | BanglaDate,
  pattern: string = DEFAULT_PATTERN,
  options: FormatOptions = {},
): string {
  const locale = options.locale ?? 'bn';
  const digits = options.digits ?? (locale === 'bn' ? 'bn' : 'latn');
  const full = complete(date, options);
  const num = (s: string) => (digits === 'bn' ? toBanglaDigits(s) : s);

  return pattern.replace(TOKEN_RE, (token, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    switch (token) {
      case 'YYYY':
        return num(String(full.year));
      case 'YY':
        return num(pad(full.year % 100, 2));
      case 'MMMM':
        return monthName(full.month, locale);
      case 'MM':
        return num(pad(full.month, 2));
      case 'M':
        return num(String(full.month));
      case 'Do':
        return locale === 'bn'
          ? num(String(full.day)) + banglaOrdinalSuffix(full.day)
          : num(String(full.day)) + englishOrdinalSuffix(full.day);
      case 'DD':
        return num(pad(full.day, 2));
      case 'D':
        return num(String(full.day));
      case 'dddd':
        return weekdayName(full.weekday, locale);
      case 'ddd':
        return weekdayName(full.weekday, locale, true);
      case 'd':
        return num(String(full.weekday));
      case 'R':
        return seasonName(full.season, locale);
      case 'E':
        return eraName(locale);
      default:
        return token;
    }
  });
}
