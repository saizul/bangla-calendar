// Convenience conversions that accept Date objects, timestamps, ISO strings
// and Bangla date strings.

import {
  type BanglaDate,
  type BanglaDateParts,
  banglaToGregorian,
  type CalendarOptions,
  daysToBangla,
  gregorianToBangla,
} from './calendar.js';
import { civilFromDays, daysFromCivil, type GregorianDate, parseIsoDate } from './gregorian.js';
import { type ParseOptions, parseBanglaDate } from './parse.js';

/**
 * Which calendar day a Date or timestamp belongs to:
 * - `Asia/Dhaka` (default): Bangladesh Standard Time, a fixed UTC+06:00. The
 *   short-lived daylight saving time of 2009 is not modelled.
 * - `UTC`
 * - `local`: the runtime's local time zone (Date#getFullYear and friends)
 * - a number: a fixed offset from UTC in minutes, for example 330 for India
 */
export type Zone = 'Asia/Dhaka' | 'UTC' | 'local' | number;

/** UTC offset of Bangladesh Standard Time in minutes. */
export const DHAKA_OFFSET_MINUTES = 360;

export interface ConvertOptions extends CalendarOptions {
  zone?: Zone;
}

export type GregorianInput = Date | number | string | GregorianDate;

const MS_PER_DAY = 86_400_000;

/** The calendar day number (days since 1970-01-01) of an instant in a zone. */
export function instantToDays(instant: Date | number, zone: Zone = 'Asia/Dhaka'): number {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  if (!Number.isFinite(ms)) throw new RangeError('Invalid date');
  if (zone === 'local') {
    const d = new Date(ms);
    return daysFromCivil(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  const offset = zone === 'UTC' ? 0 : zone === 'Asia/Dhaka' ? DHAKA_OFFSET_MINUTES : zone;
  if (typeof offset !== 'number' || !Number.isFinite(offset))
    throw new RangeError(`Unknown zone "${String(zone)}"`);
  return Math.floor((ms + offset * 60_000) / MS_PER_DAY);
}

/** Reads any supported Gregorian input as a calendar date. */
export function toGregorianDate(input: GregorianInput, zone: Zone = 'Asia/Dhaka'): GregorianDate {
  if (typeof input === 'string') {
    const parsed = parseIsoDate(input);
    if (!parsed) throw new RangeError(`Expected a date like 2026-04-14, got "${input}"`);
    return parsed;
  }
  if (typeof input === 'number' || input instanceof Date) {
    return civilFromDays(instantToDays(input, zone));
  }
  return { year: input.year, month: input.month, day: input.day };
}

/**
 * Converts to a Bangla date. Accepts a Date or timestamp (read in `zone`,
 * Asia/Dhaka by default), an ISO date string `YYYY-MM-DD`, or
 * `{ year, month, day }` in the Gregorian calendar.
 */
export function toBangla(input: GregorianInput, options: ConvertOptions = {}): BanglaDate {
  if (typeof input === 'number' || input instanceof Date) {
    return daysToBangla(instantToDays(input, options.zone), options);
  }
  return gregorianToBangla(toGregorianDate(input), options);
}

/**
 * Converts a Bangla date to the Gregorian calendar. Accepts `{ year, month, day }`
 * or a string such as `"১ বৈশাখ ১৪৩৩"`, `"1 Boishakh 1433"` or `"১৪৩৩-০১-০১"`.
 */
export function toGregorian(
  input: BanglaDateParts | string,
  options: CalendarOptions & ParseOptions = {},
): GregorianDate {
  const parts = typeof input === 'string' ? parseBanglaDate(input, options) : input;
  return banglaToGregorian(parts, options);
}

export interface TodayOptions extends ConvertOptions {
  /** The current time, for tests. Defaults to Date.now(). */
  now?: Date | number;
}

/** Today's Bangla date, in Bangladesh time by default. */
export function today(options: TodayOptions = {}): BanglaDate {
  return toBangla(options.now ?? Date.now(), options);
}
