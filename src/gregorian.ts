// Proleptic Gregorian calendar arithmetic on day numbers, with no Date or
// Intl involved. Day 0 is 1970-01-01. The algorithms are the well-known
// days-from-civil / civil-from-days conversions on 400-year eras.

import { toLatinDigits } from './digits.js';

/** A calendar date in the Gregorian calendar. `month` is 1-12. */
export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** True for Gregorian leap years: divisible by 4, except centuries not divisible by 400. */
export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in a Gregorian month (1-12). */
export function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  const days = MONTH_DAYS[month - 1];
  if (days === undefined) throw new RangeError(`Month must be 1-12, got ${month}`);
  return days;
}

/** Throws a RangeError unless the date exists in the Gregorian calendar. */
export function assertGregorianDate(date: GregorianDate): void {
  const { year, month, day } = date;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`Gregorian date parts must be integers, got ${year}-${month}-${day}`);
  }
  if (month < 1 || month > 12) throw new RangeError(`Gregorian month must be 1-12, got ${month}`);
  const max = daysInGregorianMonth(year, month);
  if (day < 1 || day > max) throw new RangeError(`Day must be 1-${max} for ${year}-${month}, got ${day}`);
}

/** Days since 1970-01-01 for a Gregorian date (negative before 1970). */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** The Gregorian date for a day number (days since 1970-01-01). */
export function civilFromDays(days: number): GregorianDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day };
}

/** Day of the week for a day number: 0 = Sunday ... 6 = Saturday. 1970-01-01 was a Thursday. */
export function weekdayFromDays(days: number): number {
  return (((days + 4) % 7) + 7) % 7;
}

/** Compares two Gregorian dates: negative, zero or positive. */
export function compareGregorian(a: GregorianDate, b: GregorianDate): number {
  return daysFromCivil(a.year, a.month, a.day) - daysFromCivil(b.year, b.month, b.day);
}

/** Parses `YYYY-MM-DD` (also with `/` or `.`, and Bangla digits). Returns undefined when it does not match. */
export function parseIsoDate(text: string): GregorianDate | undefined {
  const m = /^\s*(-?\d{1,6})[-/.](\d{1,2})[-/.](\d{1,2})\s*$/.exec(toLatinDigits(text));
  if (!m) return undefined;
  const date = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  assertGregorianDate(date);
  return date;
}

/** Formats a Gregorian date as `YYYY-MM-DD`. */
export function formatIsoDate(date: GregorianDate): string {
  const y = date.year < 0 ? `-${String(-date.year).padStart(4, '0')}` : String(date.year).padStart(4, '0');
  return `${y}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
