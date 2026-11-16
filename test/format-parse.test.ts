import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BanglaDateParseError,
  banglaOrdinalSuffix,
  englishOrdinalSuffix,
  format,
  formatBangla,
  hasBanglaDigits,
  monthName,
  normalizeForMatch,
  parse,
  parseBanglaDate,
  parseMonthName,
  parseWeekdayName,
  seasonName,
  seasonOfMonth,
  toBangla,
  toBanglaDigits,
  toLatinDigits,
  tryParseBanglaDate,
  weekdayName,
} from '../src/index.js';

const NEW_YEAR = { year: 1433, month: 1, day: 1 };

describe('digits', () => {
  it('converts both ways and keeps other characters', () => {
    assert.equal(toBanglaDigits(1433), '১৪৩৩');
    assert.equal(toBanglaDigits('2026-11-16'), '২০২৬-১১-১৬');
    assert.equal(toLatinDigits('১৪৩৩ সাল, ১০ টা'), '1433 সাল, 10 টা');
    assert.equal(hasBanglaDigits('abc ৫'), true);
    assert.equal(hasBanglaDigits('abc 5'), false);
  });
});

describe('names', () => {
  it('has month, weekday and season names in three locales', () => {
    assert.equal(monthName(1), 'বৈশাখ');
    assert.equal(monthName(8, 'en'), 'Ogrohayon');
    assert.equal(weekdayName(5), 'শুক্রবার');
    assert.equal(weekdayName(5, 'bn', true), 'শুক্র');
    assert.equal(weekdayName(5, 'bn-Latn'), 'Shukrobar');
    assert.equal(weekdayName(5, 'en'), 'Friday');
    assert.equal(seasonName(seasonOfMonth(3)), 'বর্ষা');
    assert.equal(seasonName(seasonOfMonth(12), 'en'), 'Spring');
    assert.equal(seasonName(seasonOfMonth(8), 'bn-Latn'), 'Hemonto');
    assert.throws(() => monthName(13), RangeError);
    assert.throws(() => weekdayName(7), RangeError);
    assert.throws(() => seasonOfMonth(0), RangeError);
  });

  it('maps every pair of months to one of six seasons', () => {
    assert.deepEqual(
      Array.from({ length: 12 }, (_, i) => seasonOfMonth(i + 1)),
      [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    );
  });
});

describe('formatBangla', () => {
  it('uses D MMMM YYYY by default', () => {
    assert.equal(formatBangla(NEW_YEAR), '১ বৈশাখ ১৪৩৩');
    assert.equal(format(NEW_YEAR), '১ বৈশাখ ১৪৩৩');
  });

  it('supports every token', () => {
    const d = toBangla('2026-11-16');
    assert.equal(
      formatBangla(d, 'YYYY YY MMMM MM M Do DD D dddd ddd d R E'),
      '১৪৩৩ ৩৩ অগ্রহায়ণ ০৮ ৮ ১লা ০১ ১ সোমবার সোম ১ হেমন্ত বঙ্গাব্দ',
    );
    assert.equal(
      formatBangla(d, 'YYYY YY MMMM MM M Do DD D dddd ddd d R E', { locale: 'en' }),
      '1433 33 Ogrohayon 08 8 1st 01 1 Monday Mon 1 Late autumn BS',
    );
    assert.equal(
      formatBangla(d, 'dddd, D MMMM YYYY E', { locale: 'bn-Latn' }),
      'Shombar, 1 Ogrohayon 1433 Bongabdo',
    );
  });

  it('copies [bracketed] text and leaves other characters alone', () => {
    assert.equal(formatBangla(NEW_YEAR, '[আজ] D MMMM, [Day] D'), 'আজ ১ বৈশাখ, Day ১');
    assert.equal(formatBangla(NEW_YEAR, 'D/M/YYYY'), '১/১/১৪৩৩');
  });

  it('can mix Bangla names with ASCII digits', () => {
    assert.equal(formatBangla(NEW_YEAR, 'D MMMM YYYY', { digits: 'latn' }), '1 বৈশাখ 1433');
    assert.equal(formatBangla(NEW_YEAR, 'D MMMM YYYY', { locale: 'en', digits: 'bn' }), '১ Boishakh ১৪৩৩');
  });

  it('writes Bangla ordinals as on printed dates', () => {
    const expected: Record<number, string> = {
      1: 'লা',
      2: 'রা',
      3: 'রা',
      4: 'ঠা',
      5: 'ই',
      16: 'ই',
      18: 'ই',
      19: 'শে',
      21: 'শে',
      31: 'শে',
    };
    for (const [day, suffix] of Object.entries(expected))
      assert.equal(banglaOrdinalSuffix(Number(day)), suffix, day);
    assert.equal(formatBangla({ year: 1432, month: 11, day: 8 }, 'Do MMMM'), '৮ই ফাল্গুন');
    assert.equal(formatBangla({ year: 1432, month: 1, day: 25 }, 'Do MMMM'), '২৫শে বৈশাখ');
    assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(englishOrdinalSuffix), [
      'st',
      'nd',
      'rd',
      'th',
      'th',
      'th',
      'th',
      'st',
      'nd',
      'rd',
      'st',
    ]);
  });

  it('rejects dates that do not exist', () => {
    assert.throws(() => formatBangla({ year: 1433, month: 11, day: 30 }), RangeError);
    assert.throws(() => formatBangla({ year: 1433, month: 7, day: 31 }), RangeError);
  });
});

describe('parseBanglaDate', () => {
  it('reads the common Bangla forms', () => {
    for (const text of [
      '১ বৈশাখ ১৪৩৩',
      '১লা বৈশাখ ১৪৩৩',
      '১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ',
      'মঙ্গলবার, ১ বৈশাখ ১৪৩৩',
      'বৈশাখ ১, ১৪৩৩',
      '১৪৩৩ সালের ১ বৈশাখ'.replace('সালের', 'সাল'),
      '১-বৈশাখ-১৪৩৩',
      '১৪৩৩-০১-০১',
      '১বৈশাখ ১৪৩৩',
    ]) {
      assert.deepEqual(parseBanglaDate(text), NEW_YEAR, text);
    }
  });

  it('reads romanised and English forms with spelling variants', () => {
    for (const text of [
      '1 Boishakh 1433',
      '1 Baishakh 1433 BS',
      'Baisakh 1, 1433 B.S.',
      '1st Boishakh, 1433',
      'Tuesday, 1 Boishakh 1433',
      '1433/1/1',
      '1433.01.01',
      '  1 BOISHAKH 1433  ',
    ]) {
      assert.deepEqual(parseBanglaDate(text), NEW_YEAR, text);
    }
    assert.deepEqual(parse('8 Phalgun 1432'), { year: 1432, month: 11, day: 8 });
    assert.deepEqual(parse('12 Chaitra 1432'), { year: 1432, month: 12, day: 12 });
    assert.deepEqual(parse('1 Agrahayan 1433'), { year: 1433, month: 8, day: 1 });
    assert.deepEqual(parse('16 Jyoishtho 1433'), { year: 1433, month: 2, day: 16 });
  });

  it('treats precomposed and decomposed nukta letters alike', () => {
    // আষাঢ় with U+09DD (precomposed RHA) and with U+09A2 U+09BC.
    const pre = String.fromCharCode(0x0986, 0x09b7, 0x09be, 0x09dd);
    const dec = String.fromCharCode(0x0986, 0x09b7, 0x09be, 0x09a2, 0x09bc);
    assert.equal(normalizeForMatch(pre), normalizeForMatch(dec));
    assert.equal(parseMonthName(pre), 3);
    assert.equal(parseMonthName(dec), 3);
    // অগ্রহায়ণ with U+09DF.
    assert.equal(
      parseMonthName(String.fromCharCode(0x0985, 0x0997, 0x09cd, 0x09b0, 0x09b9, 0x09be, 0x09df, 0x09a3)),
      8,
    );
  });

  it('ignores zero-width joiners', () => {
    const zwj = String.fromCharCode(0x200d);
    assert.equal(parseMonthName(`ফাল্${zwj}গুন`), 11);
  });

  it('looks up weekday names', () => {
    assert.equal(parseWeekdayName('শুক্রবার'), 5);
    assert.equal(parseWeekdayName('Shukrobar'), 5);
    assert.equal(parseWeekdayName('fri'), 5);
    assert.equal(parseWeekdayName('someday'), undefined);
  });

  it('checks the weekday when one is given', () => {
    assert.throws(() => parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩৩'), /weekday does not match.*Tuesday/);
    assert.deepEqual(parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩৩', { checkWeekday: false }), NEW_YEAR);
  });

  it('rejects strings that are not Bangla dates', () => {
    for (const text of [
      '',
      'hello',
      '১৪ এপ্রিল ২০২৬',
      '1 Boishakh',
      '1 2 3 Boishakh',
      'Boishakh Magh 1 1433',
    ]) {
      assert.throws(() => parseBanglaDate(text), BanglaDateParseError, text);
      assert.equal(tryParseBanglaDate(text), undefined);
    }
  });

  it('rejects dates that do not exist', () => {
    assert.throws(() => parseBanglaDate('৩০ ফাল্গুন ১৪৩৩'), RangeError);
    assert.deepEqual(parseBanglaDate('৩০ ফাল্গুন ১৪৩০'), { year: 1430, month: 11, day: 30 });
    assert.throws(() => parseBanglaDate('32 Boishakh 1433'), RangeError);
    assert.throws(() => parseBanglaDate('1433-13-01'), RangeError);
  });

  it('round-trips with formatBangla for every day of a leap and a common year', () => {
    for (const year of [1430, 1433]) {
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 31; day++) {
          const date = { year, month, day };
          const text = tryFormat(date);
          if (!text) continue;
          for (const t of text) assert.deepEqual(parseBanglaDate(t), date, t);
        }
      }
    }
  });
});

function tryFormat(date: { year: number; month: number; day: number }): string[] | undefined {
  try {
    return [
      formatBangla(date),
      formatBangla(date, 'dddd, Do MMMM YYYY E'),
      formatBangla(date, 'D MMMM YYYY', { locale: 'en' }),
      formatBangla(date, 'MMMM Do, YYYY E', { locale: 'en' }),
      formatBangla(date, 'dddd D MMMM YYYY', { locale: 'bn-Latn' }),
      formatBangla(date, 'YYYY-MM-DD'),
    ];
  } catch {
    return undefined;
  }
}
