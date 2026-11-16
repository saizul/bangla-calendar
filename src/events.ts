// Days that the revised calendar fixes to a Bangla date, as listed in the
// press reports on the 2019 revision (see the README for sources). Under the
// revised calendar each of them always falls on the same Gregorian date too.

import { type BanglaDateParts, type CalendarOptions, banglaToGregorian } from './calendar.js';
import type { GregorianDate } from './gregorian.js';

export interface BanglaEvent {
  id: string;
  month: number;
  day: number;
  nameBn: string;
  nameEn: string;
  /** The Gregorian day and month it falls on in the revised calendar. */
  gregorian: { month: number; day: number };
}

export const EVENTS: readonly BanglaEvent[] = [
  {
    id: 'pohela-boishakh',
    month: 1,
    day: 1,
    nameBn: 'পহেলা বৈশাখ (বাংলা নববর্ষ)',
    nameEn: 'Pohela Boishakh (Bangla New Year)',
    gregorian: { month: 4, day: 14 },
  },
  {
    id: 'rabindra-jayanti',
    month: 1,
    day: 25,
    nameBn: 'রবীন্দ্র জয়ন্তী',
    nameEn: 'Rabindra Jayanti',
    gregorian: { month: 5, day: 8 },
  },
  {
    id: 'nazrul-jayanti',
    month: 2,
    day: 11,
    nameBn: 'নজরুল জয়ন্তী',
    nameEn: 'Nazrul Jayanti',
    gregorian: { month: 5, day: 25 },
  },
  {
    id: 'victory-day',
    month: 9,
    day: 1,
    nameBn: 'বিজয় দিবস',
    nameEn: 'Victory Day',
    gregorian: { month: 12, day: 16 },
  },
  {
    id: 'pohela-falgun',
    month: 11,
    day: 1,
    nameBn: 'পহেলা ফাল্গুন (বসন্ত উৎসব)',
    nameEn: 'Pohela Falgun (spring festival)',
    gregorian: { month: 2, day: 14 },
  },
  {
    id: 'mother-language-day',
    month: 11,
    day: 8,
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: "Language Martyrs' Day and International Mother Language Day",
    gregorian: { month: 2, day: 21 },
  },
  {
    id: 'independence-day',
    month: 12,
    day: 12,
    nameBn: 'স্বাধীনতা দিবস',
    nameEn: 'Independence Day',
    gregorian: { month: 3, day: 26 },
  },
];

/** Events on a Bangla date (by month and day). */
export function eventsOn(date: Pick<BanglaDateParts, 'month' | 'day'>): BanglaEvent[] {
  return EVENTS.filter((e) => e.month === date.month && e.day === date.day);
}

/** The events of a Bangla year with their Gregorian dates, in calendar order. */
export function eventsInYear(
  year: number,
  options: CalendarOptions = {},
): { event: BanglaEvent; date: BanglaDateParts; gregorian: GregorianDate }[] {
  return EVENTS.map((event) => {
    const date = { year, month: event.month, day: event.day };
    return { event, date, gregorian: banglaToGregorian(date, options) };
  });
}
