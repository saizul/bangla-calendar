// iCalendar (RFC 5545) export: the days of Bangla years as all-day events, so
// any calendar app can show the Bangla date next to the Gregorian one, plus
// the national days that the revised calendar fixes.

import {
  type CalendarOptions,
  banglaToDays,
  daysInMonth,
  daysToBangla,
  MAX_YEAR,
  MIN_YEAR,
} from './calendar.js';
import { eventsInYear } from './events.js';
import { formatBangla } from './format.js';
import { civilFromDays, type GregorianDate } from './gregorian.js';
import type { Locale } from './names.js';
import { VERSION } from './version.js';

export interface ICalendarOptions extends CalendarOptions {
  /** Number of Bangla years from the first one (default 1). */
  years?: number;
  /** `days` (one event per day), `events` (national days) or `both` (default). */
  include?: 'days' | 'events' | 'both';
  /** Names in summaries: `bn` (default), `bn-Latn` or `en`. */
  locale?: Locale;
  /** Digits in summaries: `bn` (default for `bn`) or `latn`. */
  digits?: 'bn' | 'latn';
  /** Summary pattern of the daily events (default `D MMMM YYYY`). */
  pattern?: string;
  /** Calendar name shown by calendar apps (`X-WR-CALNAME`). */
  name?: string;
  /** Time stamp of the events (`DTSTAMP`); default now. Pass a fixed value for reproducible files. */
  now?: Date | number;
}

const CRLF = '\r\n';

/** Escapes a TEXT value (RFC 5545 section 3.3.11). */
export function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Folds a content line to at most 75 octets per line (RFC 5545 section 3.1).
 * Breaks never split a UTF-8 sequence, which matters for Bangla text where
 * every letter takes three octets.
 */
export function foldICalLine(line: string): string {
  const out: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;
  for (const ch of line) {
    const n = utf8Length(ch.codePointAt(0)!);
    if (size + n > limit) {
      out.push(current);
      current = '';
      size = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join(`${CRLF} `);
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function icalDate(date: GregorianDate): string {
  return `${pad(date.year, 4)}${pad(date.month)}${pad(date.day)}`;
}

function icalStamp(instant: Date | number): string {
  const d = new Date(instant);
  if (Number.isNaN(d.getTime())) throw new RangeError('now must be a valid date');
  return (
    `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function allDayEvent(uid: string, stamp: string, days: number, props: string[]): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icalDate(civilFromDays(days))}`,
    `DTEND;VALUE=DATE:${icalDate(civilFromDays(days + 1))}`,
    ...props,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ];
}

/**
 * An iCalendar file with the days of Bangla `year` (and the following
 * `options.years - 1` years) as all-day events, and the national days of
 * those years. Lines end in CRLF and are folded as RFC 5545 requires.
 */
export function toICalendar(year: number, options: ICalendarOptions = {}): string {
  const years = options.years ?? 1;
  const include = options.include ?? 'both';
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(`year must be a whole number from ${MIN_YEAR} to ${MAX_YEAR}`);
  }
  if (!Number.isInteger(years) || years < 1 || year + years - 1 > MAX_YEAR) {
    throw new RangeError(`years must be a whole number from 1 to ${MAX_YEAR - year + 1}`);
  }
  if (include !== 'days' && include !== 'events' && include !== 'both') {
    throw new RangeError('include must be days, events or both');
  }
  const locale = options.locale ?? 'bn';
  const format = {
    locale,
    digits: options.digits ?? (locale === 'bn' ? 'bn' : 'latn'),
    variant: options.variant,
  };
  const calendar = { variant: options.variant };
  const pattern = options.pattern ?? 'D MMMM YYYY';
  const stamp = icalStamp(options.now ?? Date.now());
  const name =
    options.name ??
    (locale === 'bn' ? 'বাংলা ক্যালেন্ডার' : locale === 'en' ? 'Bangla calendar' : 'Bangla Calendar');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//saizul//bangla-calendar ${VERSION}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(name)}`,
  ];
  for (let y = year; y < year + years; y++) {
    if (include !== 'events') {
      for (let month = 1; month <= 12; month++) {
        const length = daysInMonth(y, month, calendar);
        for (let day = 1; day <= length; day++) {
          const days = banglaToDays({ year: y, month, day }, calendar);
          const date = daysToBangla(days, calendar);
          const summary = formatBangla(date, pattern, format);
          lines.push(
            ...allDayEvent(`bangla-${y}-${pad(month)}-${pad(day)}@bangla-calendar`, stamp, days, [
              `SUMMARY:${escapeICalText(summary)}`,
            ]),
          );
        }
      }
    }
    if (include !== 'days') {
      for (const { event, date } of eventsInYear(y, calendar)) {
        const days = banglaToDays(date, calendar);
        const summary = locale === 'bn' ? event.nameBn : event.nameEn;
        lines.push(
          ...allDayEvent(`bangla-${y}-${event.id}@bangla-calendar`, stamp, days, [
            `SUMMARY:${escapeICalText(summary)}`,
            `DESCRIPTION:${escapeICalText(formatBangla(daysToBangla(days, calendar), 'D MMMM YYYY', format))}`,
            'CATEGORIES:HOLIDAY',
          ]),
        );
      }
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldICalLine).join(CRLF) + CRLF;
}
