// A month grid for calendar views: weeks as rows, weekdays as columns.

import { type CalendarOptions, banglaToDays, banglaToGregorian, daysInMonth } from './calendar.js';
import { toBanglaDigits } from './digits.js';
import { weekdayFromDays } from './gregorian.js';
import { type Locale, monthName, weekdayName } from './names.js';

export interface MonthGrid {
  year: number;
  month: number;
  days: number;
  /** Weekday (0 = Sunday) of the first day of the month. */
  firstWeekday: number;
  /** Rows of seven cells; `null` pads the first and last week. */
  weeks: (number | null)[][];
  /** Gregorian date of the first and last day. */
  start: { year: number; month: number; day: number };
  end: { year: number; month: number; day: number };
}

export interface MonthGridOptions extends CalendarOptions {
  /** First column of the grid: 0 = Sunday (default), 1 = Monday, 6 = Saturday. */
  weekStartsOn?: number;
}

/** Builds the grid of a Bangla month. */
export function monthGrid(year: number, month: number, options: MonthGridOptions = {}): MonthGrid {
  const start = options.weekStartsOn ?? 0;
  if (!Number.isInteger(start) || start < 0 || start > 6) throw new RangeError('weekStartsOn must be 0-6');
  const days = daysInMonth(year, month, options);
  const firstWeekday = weekdayFromDays(banglaToDays({ year, month, day: 1 }, options));
  const lead = (firstWeekday - start + 7) % 7;
  const cells: (number | null)[] = [...Array<null>(lead).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return {
    year,
    month,
    days,
    firstWeekday,
    weeks,
    start: banglaToGregorian({ year, month, day: 1 }, options),
    end: banglaToGregorian({ year, month, day: days }, options),
  };
}

/** Weekday headers for the month grid in Bangla, as printed on Bangla wall calendars. */
const GRID_WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const GRID_WEEKDAYS_LATN = ['Robi', 'Shom', 'Mong', 'Budh', 'Brih', 'Shuk', 'Shon'];

/**
 * Approximate terminal width of a string: Bangla vowel signs, virama, nukta
 * and other combining marks take no column of their own.
 */
export function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const combining =
      (cp >= 0x0981 && cp <= 0x0983) || cp === 0x09bc || (cp >= 0x09be && cp <= 0x09cd) || cp === 0x09d7;
    const joiner = cp === 0x200c || cp === 0x200d;
    if (!combining && !joiner) width++;
  }
  return width;
}

function padStartWidth(text: string, width: number): string {
  const w = displayWidth(text);
  return w >= width ? text : ' '.repeat(width - w) + text;
}

export interface RenderMonthOptions extends MonthGridOptions {
  locale?: Locale;
  digits?: 'bn' | 'latn';
  /** A day to mark with brackets, for example today. */
  highlight?: number;
}

/** Renders a month as plain text, like `cal`. */
export function renderMonth(year: number, month: number, options: RenderMonthOptions = {}): string {
  const locale = options.locale ?? 'bn';
  const digits = options.digits ?? (locale === 'bn' ? 'bn' : 'latn');
  const num = (n: number) => (digits === 'bn' ? toBanglaDigits(n) : String(n));
  const grid = monthGrid(year, month, options);
  const start = options.weekStartsOn ?? 0;
  const cellWidth = locale === 'en' ? 4 : 6;
  const header = Array.from({ length: 7 }, (_, i) => {
    const weekday = (start + i) % 7;
    if (locale === 'bn') return GRID_WEEKDAYS_BN[weekday]!;
    if (locale === 'bn-Latn') return GRID_WEEKDAYS_LATN[weekday]!;
    return weekdayName(weekday, locale, true);
  });
  const title = `${monthName(month, locale)} ${num(year)}`;
  const lines = [title, header.map((h) => padStartWidth(h, cellWidth)).join('')];
  for (const week of grid.weeks) {
    lines.push(
      week
        .map((d) => {
          if (d === null) return ' '.repeat(cellWidth);
          const text = options.highlight === d ? `[${num(d)}]` : num(d);
          return padStartWidth(text, cellWidth);
        })
        .join('')
        .trimEnd(),
    );
  }
  return `${lines.join('\n')}\n`;
}
