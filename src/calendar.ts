// The Bangladesh Bangla calendar (Bongabdo) and conversion to and from the
// Gregorian calendar.
//
// Rules (see the README for sources):
// - Revised calendar (Bangla Academy, in use from 1426 BS / 2019): Boishakh to
//   Ashwin have 31 days, Kartik to Magh and Choitro have 30, and Falgun has 29
//   days, or 30 in a leap year.
// - Previous calendar (in use until 1425 BS): Boishakh to Bhadro have 31
//   days, Ashwin to Magh and Choitro have 30, and Falgun has 30 days, or 31 in
//   a leap year.
// - In both, the year starts on 14 April (Pohela Boishakh) and Bangla year Y
//   starts in Gregorian year Y + 593. Falgun of year Y falls in February and
//   March of Gregorian year Y + 594, and it gets the extra day when that
//   Gregorian year is a leap year. That keeps 1 Choitro on 15 March and
//   every Pohela Boishakh on 14 April.

import { civilFromDays, daysFromCivil, type GregorianDate, weekdayFromDays } from './gregorian.js';

/**
 * Which set of month lengths to use:
 * - `revised`: the current Bangladesh calendar, applied to every year (default).
 * - `pre-2019`: the previous Bangladesh calendar, applied to every year.
 * - `historical`: `pre-2019` up to 1425 BS and `revised` from 1426 BS, the
 *   year the revision took effect. Years before the previous calendar was
 *   adopted are computed with its rules too, which is an approximation.
 */
export type CalendarVariant = 'revised' | 'pre-2019' | 'historical';

export const CALENDAR_VARIANTS: readonly CalendarVariant[] = ['revised', 'pre-2019', 'historical'];

/** The first Bangla year of the revised calendar. */
export const REVISED_FROM_YEAR = 1426;

/** Gregorian year = Bangla year + YEAR_OFFSET for dates from 14 April to 31 December. */
export const YEAR_OFFSET = 593;

/** Smallest and largest supported Bangla years. */
export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

/** A Bangla calendar date. `month` is 1 (Boishakh) to 12 (Choitro). */
export interface BanglaDateParts {
  year: number;
  month: number;
  day: number;
}

/** A Bangla date with derived fields. */
export interface BanglaDate extends BanglaDateParts {
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  /** Day of the Bangla year, 1 = 1 Boishakh. */
  dayOfYear: number;
  /** Season (ritu), 0 = Grishmo ... 5 = Boshonto. */
  season: number;
  /** True when the Bangla year has a 366-day year (a longer Falgun). */
  leapYear: boolean;
}

export interface CalendarOptions {
  variant?: CalendarVariant;
}

function variantFor(year: number, variant: CalendarVariant = 'revised'): 'revised' | 'pre-2019' {
  if (variant === 'historical') return year >= REVISED_FROM_YEAR ? 'revised' : 'pre-2019';
  if (variant !== 'revised' && variant !== 'pre-2019')
    throw new RangeError(`Unknown calendar variant "${variant}"`);
  return variant;
}

function assertYear(year: number): void {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`Bangla year must be an integer from ${MIN_YEAR} to ${MAX_YEAR}, got ${year}`);
  }
}

/**
 * True when Bangla year `year` has 366 days, which is when the Gregorian year
 * that contains its Falgun (year + 594) is a leap year. The same in all variants.
 */
export function isLeapYear(year: number): boolean {
  assertYear(year);
  const g = year + YEAR_OFFSET + 1;
  return (g % 4 === 0 && g % 100 !== 0) || g % 400 === 0;
}

/** The twelve month lengths of a Bangla year. */
export function monthLengths(year: number, options: CalendarOptions = {}): number[] {
  const leap = isLeapYear(year);
  if (variantFor(year, options.variant) === 'revised') {
    return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
  }
  return [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, leap ? 31 : 30, 30];
}

/** Days in a Bangla month (1-12). */
export function daysInMonth(year: number, month: number, options: CalendarOptions = {}): number {
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError(`Month must be 1-12, got ${month}`);
  return monthLengths(year, options)[month - 1]!;
}

/** Days in a Bangla year: 365 or 366. */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** Throws a RangeError unless the date exists in the chosen calendar. */
export function assertBanglaDate(date: BanglaDateParts, options: CalendarOptions = {}): void {
  const { year, month, day } = date;
  assertYear(year);
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError(`Month must be 1-12, got ${month}`);
  const max = daysInMonth(year, month, options);
  if (!Number.isInteger(day) || day < 1 || day > max) {
    throw new RangeError(`Day must be 1-${max} for month ${month} of ${year}, got ${day}`);
  }
}

/** True when the date exists in the chosen calendar. */
export function isValidBanglaDate(date: BanglaDateParts, options: CalendarOptions = {}): boolean {
  try {
    assertBanglaDate(date, options);
    return true;
  } catch {
    return false;
  }
}

/** Day number (days since 1970-01-01) of 1 Boishakh of a Bangla year. */
export function yearStartDays(year: number): number {
  return daysFromCivil(year + YEAR_OFFSET, 4, 14);
}

/** Day number of a Bangla date. */
export function banglaToDays(date: BanglaDateParts, options: CalendarOptions = {}): number {
  assertBanglaDate(date, options);
  const lengths = monthLengths(date.year, options);
  let offset = date.day - 1;
  for (let m = 0; m < date.month - 1; m++) offset += lengths[m]!;
  return yearStartDays(date.year) + offset;
}

/** Smallest and largest day numbers that map to a supported Bangla date. */
export const MIN_DAYS = daysFromCivil(MIN_YEAR + YEAR_OFFSET, 4, 14);
export const MAX_DAYS = daysFromCivil(MAX_YEAR + YEAR_OFFSET + 1, 4, 13);

/** The Bangla date for a day number (days since 1970-01-01). */
export function daysToBangla(days: number, options: CalendarOptions = {}): BanglaDate {
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    throw new RangeError(`Date is outside the supported range (Bangla years ${MIN_YEAR}-${MAX_YEAR})`);
  }
  const g = civilFromDays(days);
  const beforeNewYear = g.month < 4 || (g.month === 4 && g.day < 14);
  const year = g.year - YEAR_OFFSET - (beforeNewYear ? 1 : 0);
  const dayOfYear = days - yearStartDays(year) + 1;
  const lengths = monthLengths(year, options);
  let rest = dayOfYear - 1;
  let month = 1;
  while (rest >= lengths[month - 1]!) {
    rest -= lengths[month - 1]!;
    month++;
  }
  return {
    year,
    month,
    day: rest + 1,
    weekday: weekdayFromDays(days),
    dayOfYear,
    season: Math.floor((month - 1) / 2),
    leapYear: isLeapYear(year),
  };
}

/** Converts a Gregorian date to the Bangla calendar. */
export function gregorianToBangla(date: GregorianDate, options: CalendarOptions = {}): BanglaDate {
  return daysToBangla(daysFromCivil(date.year, date.month, date.day), options);
}

/** Converts a Bangla date to the Gregorian calendar. */
export function banglaToGregorian(date: BanglaDateParts, options: CalendarOptions = {}): GregorianDate {
  return civilFromDays(banglaToDays(date, options));
}

/** Adds (or subtracts) days to a Bangla date. */
export function addDays(date: BanglaDateParts, days: number, options: CalendarOptions = {}): BanglaDate {
  if (!Number.isInteger(days)) throw new RangeError(`days must be an integer, got ${days}`);
  return daysToBangla(banglaToDays(date, options) + days, options);
}

/**
 * Adds months, keeping the day when possible and clamping it to the length
 * of the target month otherwise (31 Ashwin + 1 month = 30 Kartik).
 */
export function addMonths(date: BanglaDateParts, months: number, options: CalendarOptions = {}): BanglaDate {
  if (!Number.isInteger(months)) throw new RangeError(`months must be an integer, got ${months}`);
  assertBanglaDate(date, options);
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const day = Math.min(date.day, daysInMonth(year, month, options));
  return daysToBangla(banglaToDays({ year, month, day }, options), options);
}

/** Days from `a` to `b` (positive when `b` is later). */
export function diffDays(a: BanglaDateParts, b: BanglaDateParts, options: CalendarOptions = {}): number {
  return banglaToDays(b, options) - banglaToDays(a, options);
}

/** Compares two Bangla dates: negative, zero or positive. */
export function compareBangla(a: BanglaDateParts, b: BanglaDateParts): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
