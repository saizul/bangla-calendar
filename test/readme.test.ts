// The examples shown in the README, so the documentation cannot drift.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatBangla,
  monthGrid,
  parseBanglaDate,
  toBangla,
  toGregorian,
  today,
  tryParseBanglaDate,
} from '../src/index.js';

describe('README examples', () => {
  it('the introduction', () => {
    assert.equal(formatBangla(toBangla('2026-04-14')), '১ বৈশাখ ১৪৩৩');
    assert.equal(formatBangla(toBangla('2026-02-21'), 'Do MMMM YYYY'), '৮ই ফাল্গুন ১৪৩২');
    assert.equal(
      formatBangla(today({ now: Date.UTC(2026, 10, 16, 6) }), 'dddd, D MMMM YYYY E, R'),
      'সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত',
    );
    assert.deepEqual(toGregorian('১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ'), { year: 2026, month: 4, day: 14 });
    assert.equal(formatBangla(toBangla('2026-12-16'), 'D MMMM YYYY E', { locale: 'en' }), '1 Poush 1433 BS');
  });

  it('variants', () => {
    const h = toBangla('2018-02-21', { variant: 'historical' });
    assert.deepEqual([h.year, h.month, h.day], [1424, 11, 9]);
    const r = toBangla('2018-02-21');
    assert.deepEqual([r.year, r.month, r.day], [1424, 11, 8]);
  });

  it('converting', () => {
    assert.deepEqual(toBangla('2026-11-16'), {
      year: 1433,
      month: 8,
      day: 1,
      weekday: 1,
      dayOfYear: 217,
      season: 3,
      leapYear: false,
    });
    assert.deepEqual(toGregorian({ year: 1433, month: 1, day: 1 }), { year: 2026, month: 4, day: 14 });
    assert.deepEqual(toGregorian('৮ই ফাল্গুন ১৪৩২'), { year: 2026, month: 2, day: 21 });
    assert.throws(() => toGregorian({ year: 1433, month: 11, day: 30 }), RangeError);
  });

  it('formatting', () => {
    const d = toBangla('2026-02-21');
    assert.equal(formatBangla(d), '৮ ফাল্গুন ১৪৩২');
    assert.equal(formatBangla(d, 'dddd, Do MMMM YYYY E'), 'শনিবার, ৮ই ফাল্গুন ১৪৩২ বঙ্গাব্দ');
    assert.equal(formatBangla(d, 'DD-MM-YYYY'), '০৮-১১-১৪৩২');
    assert.equal(formatBangla(d, '[ঋতু:] R'), 'ঋতু: বসন্ত');
    assert.equal(formatBangla(d, 'D MMMM YYYY', { digits: 'latn' }), '8 ফাল্গুন 1432');
    assert.equal(formatBangla(d, 'dddd, Do MMMM YYYY E', { locale: 'en' }), 'Saturday, 8th Falgun 1432 BS');
    assert.equal(
      formatBangla(d, 'dddd, D MMMM YYYY E', { locale: 'bn-Latn' }),
      'Shonibar, 8 Falgun 1432 Bongabdo',
    );
  });

  it('parsing', () => {
    const ny = { year: 1433, month: 1, day: 1 };
    assert.deepEqual(parseBanglaDate('১ বৈশাখ ১৪৩৩'), ny);
    assert.deepEqual(parseBanglaDate('মঙ্গলবার, ১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ'), ny);
    assert.deepEqual(parseBanglaDate('Baishakh 1, 1433 B.S.'), ny);
    assert.deepEqual(parseBanglaDate('1st Boishakh 1433'), ny);
    assert.deepEqual(parseBanglaDate('১৪৩৩-০১-০১'), ny);
    assert.throws(() => parseBanglaDate('সোমবার, ১ বৈশাখ ১৪৩৩'), RangeError);
    assert.equal(tryParseBanglaDate('১৪ এপ্রিল ২০২৬'), undefined);
    for (const m of ['Jaistha', 'Ogrohayon', 'অঘ্রাণ', 'Phalgun', 'ফাগুন', 'Choitro']) {
      assert.ok(tryParseBanglaDate(`1 ${m} 1433`), m);
    }
  });

  it('month grid', () => {
    assert.deepEqual(monthGrid(1433, 8).weeks[0], [null, 1, 2, 3, 4, 5, 6]);
  });
});
