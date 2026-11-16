import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertBanglaDate,
  EVENTS,
  eventsInYear,
  eventsOn,
  formatIsoDate,
  instantToDays,
  isValidBanglaDate,
  monthGrid,
  parseIsoDate,
  renderMonth,
  today,
  toBangla,
  toGregorian,
  toGregorianDate,
} from '../src/index.js';

describe('toBangla inputs', () => {
  it('accepts ISO strings, objects, Dates and timestamps', () => {
    const expected = { year: 1433, month: 1, day: 1 };
    const pick = (d: { year: number; month: number; day: number }) => ({
      year: d.year,
      month: d.month,
      day: d.day,
    });
    assert.deepEqual(pick(toBangla('2026-04-14')), expected);
    assert.deepEqual(pick(toBangla('২০২৬-০৪-১৪')), expected);
    assert.deepEqual(pick(toBangla({ year: 2026, month: 4, day: 14 })), expected);
    assert.deepEqual(pick(toBangla(new Date(Date.UTC(2026, 3, 14, 12)))), expected);
    assert.deepEqual(pick(toBangla(Date.UTC(2026, 3, 14, 12))), expected);
  });

  it('reads instants in Bangladesh time by default', () => {
    // 18:30 UTC on 13 April is 00:30 on 14 April in Dhaka.
    const instant = Date.UTC(2026, 3, 13, 18, 30);
    assert.equal(toBangla(instant).day, 1);
    assert.equal(toBangla(instant, { zone: 'UTC' }).day, 30);
    assert.equal(toBangla(instant, { zone: 330 }).day, 1); // India, UTC+05:30: 00:00
    assert.equal(toBangla(instant, { zone: 300 }).day, 30); // UTC+05:00: 23:30
    assert.equal(instantToDays(0, 'UTC'), 0);
    assert.equal(instantToDays(-1, 'UTC'), -1);
    assert.throws(() => instantToDays(Number.NaN), RangeError);
    assert.throws(() => instantToDays(0, 'Mars/Olympus' as never), RangeError);
  });

  it('local zone uses the runtime calendar day', () => {
    const now = new Date(2026, 10, 16, 12, 0);
    const d = toBangla(now, { zone: 'local' });
    assert.deepEqual([d.year, d.month, d.day], [1433, 8, 1]);
  });

  it('rejects invalid Gregorian dates', () => {
    assert.throws(() => toBangla('2026-02-29'), RangeError);
    assert.throws(() => toBangla('2026-13-01'), RangeError);
    assert.throws(() => toBangla('14 April 2026'), RangeError);
    assert.throws(() => toBangla(new Date(Number.NaN)), RangeError);
    assert.equal(parseIsoDate('nope'), undefined);
    assert.deepEqual(toGregorianDate('2024-02-29'), { year: 2024, month: 2, day: 29 });
    assert.equal(formatIsoDate({ year: 594, month: 4, day: 14 }), '0594-04-14');
  });
});

describe('today', () => {
  it('uses Asia/Dhaka unless told otherwise', () => {
    const now = Date.UTC(2026, 10, 15, 18, 30); // 00:30 on 16 November in Dhaka
    const d = today({ now });
    assert.deepEqual([d.year, d.month, d.day, d.weekday], [1433, 8, 1, 1]);
    const u = today({ now, zone: 'UTC' });
    assert.deepEqual([u.year, u.month, u.day], [1433, 7, 30]);
  });

  it('defaults to the current time', () => {
    const d = today();
    assert.ok(d.year >= 1433);
  });
});

describe('toGregorian', () => {
  it('accepts objects and strings in any variant', () => {
    assert.deepEqual(toGregorian({ year: 1432, month: 9, day: 1 }), { year: 2025, month: 12, day: 16 });
    assert.deepEqual(toGregorian('৮ ফাল্গুন ১৪৩২'), { year: 2026, month: 2, day: 21 });
    assert.deepEqual(toGregorian('1 Falgun 1424', { variant: 'historical' }), {
      year: 2018,
      month: 2,
      day: 13,
    });
  });
});

describe('validation', () => {
  it('reports impossible dates', () => {
    assert.equal(isValidBanglaDate({ year: 1433, month: 6, day: 31 }), true);
    assert.equal(isValidBanglaDate({ year: 1433, month: 6, day: 31 }, { variant: 'pre-2019' }), false);
    assert.equal(isValidBanglaDate({ year: 0, month: 1, day: 1 }), false);
    assert.equal(isValidBanglaDate({ year: 1433, month: 1.5, day: 1 }), false);
    assert.throws(
      () => assertBanglaDate({ year: 1433, month: 1, day: 1 }, { variant: 'west-bengal' as never }),
      /variant/,
    );
  });
});

describe('events', () => {
  it('lists the fixed national days', () => {
    assert.equal(EVENTS.length, 7);
    assert.deepEqual(
      eventsOn({ month: 11, day: 8 }).map((e) => e.id),
      ['mother-language-day'],
    );
    assert.deepEqual(eventsOn({ month: 3, day: 3 }), []);
  });

  it('every event falls on its Gregorian date in the revised calendar, in many years', () => {
    for (let year = 1426; year <= 1500; year++) {
      for (const { event, gregorian } of eventsInYear(year)) {
        assert.deepEqual(
          [gregorian.month, gregorian.day],
          [event.gregorian.month, event.gregorian.day],
          `${event.id} ${year}`,
        );
      }
    }
  });
});

describe('month view', () => {
  it('builds the grid of a month', () => {
    const g = monthGrid(1433, 8);
    assert.equal(g.days, 30);
    assert.equal(g.firstWeekday, 1);
    assert.deepEqual(g.weeks[0], [null, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(g.start, { year: 2026, month: 11, day: 16 });
    assert.deepEqual(g.end, { year: 2026, month: 12, day: 15 });
    const sat = monthGrid(1433, 8, { weekStartsOn: 6 });
    assert.deepEqual(sat.weeks[0], [null, null, 1, 2, 3, 4, 5]);
    assert.throws(() => monthGrid(1433, 8, { weekStartsOn: 7 }), RangeError);
  });

  it('renders text with a highlighted day', () => {
    const text = renderMonth(1433, 8, { highlight: 1 });
    assert.match(text, /^অগ্রহায়ণ ১৪৩৩\n/);
    assert.match(text, /\[১\]/);
    const en = renderMonth(1433, 1, { locale: 'en' });
    assert.match(en, /^Boishakh 1433\n Sun Mon Tue/);
    assert.match(en, /27 {2}28 {2}29 {2}30 {2}31$/m);
  });
});
