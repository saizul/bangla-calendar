// Parsing Bangla date strings such as "১ বৈশাখ ১৪৩৩", "১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ",
// "1 Boishakh 1433", "Baishakh 1, 1433 BS" and numeric "১৪৩৩-০১-০১".

import { type BanglaDateParts, type CalendarOptions, assertBanglaDate, banglaToDays } from './calendar.js';
import { toLatinDigits } from './digits.js';
import { weekdayFromDays } from './gregorian.js';
import {
  MONTHS_BN,
  MONTHS_LATN,
  WEEKDAYS_BN,
  WEEKDAYS_BN_SHORT,
  WEEKDAYS_EN,
  WEEKDAYS_LATN,
} from './names.js';

export interface ParseOptions extends CalendarOptions {
  /**
   * When the string names a weekday, check that it matches the date and throw
   * otherwise. Default true.
   */
  checkWeekday?: boolean;
}

/** Thrown when a string cannot be read as a Bangla date. */
export class BanglaDateParseError extends Error {
  constructor(
    message: string,
    readonly input: string,
  ) {
    super(message);
    this.name = 'BanglaDateParseError';
  }
}

const ch = (...codes: number[]) => String.fromCharCode(...codes);
const NUKTA = ch(0x09bc);
const PRECOMPOSED: [string, string][] = [
  [ch(0x09dc), ch(0x09a1) + NUKTA], // RRA
  [ch(0x09dd), ch(0x09a2) + NUKTA], // RHA
  [ch(0x09df), ch(0x09af) + NUKTA], // YYA
];
const LEGACY_KHANDA_TA = ch(0x09a4, 0x09cd, 0x200d);
const KHANDA_TA = ch(0x09ce);
const JOINERS = [ch(0x200c), ch(0x200d)];

/**
 * Normalizes text for matching without Intl or String#normalize: Bangla
 * digits to ASCII, precomposed nukta letters to their decomposed form,
 * legacy khanda ta to U+09CE, joiners removed, Latin letters lower-cased.
 */
export function normalizeForMatch(text: string): string {
  let s = toLatinDigits(text).split(LEGACY_KHANDA_TA).join(KHANDA_TA);
  for (const [from, to] of PRECOMPOSED) s = s.split(from).join(to);
  for (const j of JOINERS) s = s.split(j).join('');
  return s.toLowerCase();
}

const BN_MONTH_VARIANTS: string[][] = [
  ['বৈশাখ', 'বোশেখ'],
  ['জ্যৈষ্ঠ', 'জৈষ্ঠ', 'জ্যৈষ্ট', 'জ্যেষ্ঠ', 'জৈষ্ঠ্য'],
  ['আষাঢ়', 'আষাড়', 'আষাঢ'],
  ['শ্রাবণ', 'শ্রাবন', 'শাওন'],
  ['ভাদ্র', 'ভাদর'],
  ['আশ্বিন', 'আশ্শিন'],
  ['কার্তিক', 'কার্ত্তিক'],
  ['অগ্রহায়ণ', 'অগ্রহায়ন', 'অঘ্রাণ', 'অঘ্রান', 'অগ্রাহায়ণ'],
  ['পৌষ'],
  ['মাঘ'],
  ['ফাল্গুন', 'ফাগুন'],
  ['চৈত্র', 'চোত'],
];

const LATN_MONTH_VARIANTS: string[][] = [
  ['baishakh', 'boishak', 'baisakh', 'boisakh', 'baishak', 'vaishakh', 'vaisakh', 'bysakh'],
  [
    'jyoishtho',
    'jaishtha',
    'jyaistha',
    'jaistha',
    'joishto',
    'jyoishto',
    'jyeshtha',
    'jaishtho',
    'joishtha',
    'jyestha',
  ],
  ['ashar', 'asadh', 'ashadh', 'asarh', 'ashad', 'asar', 'asharh', 'aashar'],
  ['shrabon', 'shraban', 'sraban', 'shravan', 'sravan', 'srabon', 'shrabon', 'srabhon'],
  ['bhadra', 'bhadro', 'vadro', 'bhadrah'],
  ['ashshin', 'ashin', 'aswin', 'ashvin', 'ashwin', 'ashwina'],
  ['kartick', 'kartika', 'karthik', 'kartik'],
  [
    'agrahayan',
    'ogrohayan',
    'agrohayon',
    'aghrayan',
    'agrahayon',
    'ograhayan',
    'ogrohayon',
    'agrahayana',
    'aghran',
  ],
  ['paush', 'pous', 'pausha', 'pousha', 'poush', 'paush'],
  ['magha', 'magh', 'maagh'],
  ['phalgun', 'falgoon', 'phalguna', 'falgun', 'phagun', 'fagun'],
  ['chaitra', 'choitra', 'chaitro', 'chaitro', 'choitro', 'chait'],
];

const MONTH_LOOKUP = new Map<string, number>();
for (let i = 0; i < 12; i++) {
  for (const name of [MONTHS_BN[i]!, ...BN_MONTH_VARIANTS[i]!, MONTHS_LATN[i]!, ...LATN_MONTH_VARIANTS[i]!]) {
    MONTH_LOOKUP.set(normalizeForMatch(name), i + 1);
  }
}

const WEEKDAY_LOOKUP = new Map<string, number>();
for (let i = 0; i < 7; i++) {
  for (const name of [WEEKDAYS_BN[i]!, WEEKDAYS_BN_SHORT[i]!, WEEKDAYS_LATN[i]!, WEEKDAYS_EN[i]!]) {
    WEEKDAY_LOOKUP.set(normalizeForMatch(name), i);
  }
  WEEKDAY_LOOKUP.set(WEEKDAYS_EN[i]!.slice(0, 3).toLowerCase(), i);
}
// Common alternative spellings of weekdays.
for (const [name, day] of [
  ['sombar', 1],
  ['mangalbar', 2],
  ['brihaspatibar', 4],
  ['sukrobar', 5],
  ['shukrabar', 5],
  ['shanibar', 6],
  ['sonibar', 6],
  ['robibar', 0],
  ['rabibar', 0],
] as const) {
  WEEKDAY_LOOKUP.set(name, day);
}

const ERA_WORDS = new Set(
  [
    'বঙ্গাব্দ',
    'বঙ্গাব্দে',
    'বাংলা',
    'সন',
    'সাল',
    'সনের',
    'bs',
    'bangabda',
    'bongabdo',
    'bangabdo',
    'bangla',
    'bengali',
    'san',
    'sal',
  ].map(normalizeForMatch),
);

const BN_ORDINAL_SUFFIXES = ['লা', 'রা', 'ঠা', 'ই', 'শে'].map(normalizeForMatch);
const EN_ORDINAL_SUFFIXES = ['st', 'nd', 'rd', 'th'];

type Token = { kind: 'num'; value: number; suffix: string } | { kind: 'word'; value: string };

function isDigit(cp: number): boolean {
  return cp >= 48 && cp <= 57;
}
function isWordChar(cp: number): boolean {
  return (cp >= 97 && cp <= 122) || (cp >= 0x0980 && cp <= 0x09ff) || cp === 0x200c || cp === 0x200d;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const cp = text.charCodeAt(i);
    if (isDigit(cp)) {
      let j = i;
      while (j < text.length && isDigit(text.charCodeAt(j))) j++;
      let k = j;
      while (k < text.length && isWordChar(text.charCodeAt(k))) k++;
      tokens.push({ kind: 'num', value: Number(text.slice(i, j)), suffix: text.slice(j, k) });
      i = k;
    } else if (isWordChar(cp)) {
      let j = i;
      while (j < text.length && isWordChar(text.charCodeAt(j))) j++;
      tokens.push({ kind: 'word', value: text.slice(i, j) });
      i = j;
    } else {
      i++;
    }
  }
  return tokens;
}

/** Looks up a month name in Bangla or romanised spelling. Returns 1-12 or undefined. */
export function parseMonthName(name: string): number | undefined {
  return MONTH_LOOKUP.get(normalizeForMatch(name.trim()));
}

/** Looks up a weekday name (Bangla, romanised or English). Returns 0-6 or undefined. */
export function parseWeekdayName(name: string): number | undefined {
  return WEEKDAY_LOOKUP.get(normalizeForMatch(name.trim()));
}

/**
 * Parses a Bangla date string. Accepted forms, in Bangla or ASCII digits:
 *
 * - `১ বৈশাখ ১৪৩৩`, `১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ`, `মঙ্গলবার, ১ বৈশাখ ১৪৩৩`
 * - `1 Boishakh 1433`, `Baishakh 1, 1433 BS`, `1st Boishakh 1433`
 * - `১৪৩৩-০১-০১`, `1433/1/1` (year, month, day)
 *
 * Month names accept common spelling variants. Throws BanglaDateParseError
 * for unreadable strings and RangeError for dates that do not exist.
 */
export function parseBanglaDate(text: string, options: ParseOptions = {}): BanglaDateParts {
  const normalized = normalizeForMatch(text).replace(/\bb\.\s*s\.?/g, ' bs ');
  const numeric = /^\s*(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,2})\s*$/.exec(normalized);
  if (numeric) {
    const date = { year: Number(numeric[1]), month: Number(numeric[2]), day: Number(numeric[3]) };
    assertBanglaDate(date, options);
    return date;
  }

  let month: number | undefined;
  let weekday: number | undefined;
  const numbers: number[] = [];
  for (const token of tokenize(normalized)) {
    if (token.kind === 'num') {
      const suffix = token.suffix;
      if (suffix && !BN_ORDINAL_SUFFIXES.includes(suffix) && !EN_ORDINAL_SUFFIXES.includes(suffix)) {
        // A number glued to a word, as in "১বৈশাখ".
        const m = MONTH_LOOKUP.get(suffix);
        if (m === undefined) throw new BanglaDateParseError(`Unexpected "${token.value}${suffix}"`, text);
        if (month !== undefined) throw new BanglaDateParseError('More than one month name', text);
        month = m;
      }
      numbers.push(token.value);
      continue;
    }
    const word = token.value;
    if (ERA_WORDS.has(word)) continue;
    const m = MONTH_LOOKUP.get(word);
    if (m !== undefined) {
      if (month !== undefined) throw new BanglaDateParseError('More than one month name', text);
      month = m;
      continue;
    }
    const w = WEEKDAY_LOOKUP.get(word);
    if (w !== undefined) {
      weekday = w;
      continue;
    }
    throw new BanglaDateParseError(`Unknown word "${word}"`, text);
  }

  if (month === undefined) throw new BanglaDateParseError('No Bangla month name found', text);
  if (numbers.length !== 2) {
    throw new BanglaDateParseError(`Expected a day and a year, found ${numbers.length} number(s)`, text);
  }
  // The year is the number above 31; when both could be days, the first is the day.
  const [a, b] = numbers as [number, number];
  const [day, year] = a > 31 && b <= 31 ? [b, a] : [a, b];
  const date = { year, month, day };
  assertBanglaDate(date, options);
  if (weekday !== undefined && options.checkWeekday !== false) {
    const actual = weekdayFromDays(banglaToDays(date, options));
    if (actual !== weekday) {
      throw new RangeError(
        `${text.trim()}: the weekday does not match (that date is a ${WEEKDAYS_EN[actual]})`,
      );
    }
  }
  return date;
}

/** Like parseBanglaDate, but returns undefined instead of throwing. */
export function tryParseBanglaDate(text: string, options: ParseOptions = {}): BanglaDateParts | undefined {
  try {
    return parseBanglaDate(text, options);
  } catch {
    return undefined;
  }
}
