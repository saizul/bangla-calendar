// Property tests: round trips over long ranges, continuity of the day count,
// and agreement of the Gregorian arithmetic with Date.UTC.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addDays,
  addMonths,
  banglaToDays,
  banglaToGregorian,
  CALENDAR_VARIANTS,
  civilFromDays,
  compareBangla,
  daysFromCivil,
  daysInYear,
  daysToBangla,
  diffDays,
  gregorianToBangla,
  MAX_DAYS,
  MAX_YEAR,
  MIN_DAYS,
  MIN_YEAR,
  monthLengths,
  weekdayFromDays,
  yearStartDays,
} from '../src/index.js';

/** A small deterministic pseudo-random generator (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Gregorian arithmetic', () => {
  it('agrees with Date.UTC for every day from 1900 to 2100 and for random days', () => {
    const start = daysFromCivil(1900, 1, 1);
    const end = daysFromCivil(2100, 12, 31);
    for (let d = start; d <= end; d++) {
      const g = civilFromDays(d);
      assert.equal(daysFromCivil(g.year, g.month, g.day), d);
      if (d % 97 === 0) {
        const dt = new Date(d * 86_400_000);
        assert.deepEqual(g, { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() });
        assert.equal(weekdayFromDays(d), dt.getUTCDay());
      }
    }
    const r = rng(7);
    for (let i = 0; i < 5000; i++) {
      const d = Math.floor(r() * (MAX_DAYS - MIN_DAYS)) + MIN_DAYS;
      const dt = new Date(d * 86_400_000);
      const g = civilFromDays(d);
      assert.deepEqual(g, { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() });
    }
  });
});

describe('round trips', () => {
  for (const variant of CALENDAR_VARIANTS) {
    it(`every day from 1300 to 1600 BS round-trips (${variant})`, () => {
      const start = yearStartDays(1300);
      const end = yearStartDays(1601) - 1;
      let prev = daysToBangla(start - 1, { variant });
      for (let d = start; d <= end; d++) {
        const b = daysToBangla(d, { variant });
        assert.equal(banglaToDays(b, { variant }), d);
        // Consecutive days are consecutive Bangla dates.
        assert.ok(compareBangla(prev, b) < 0);
        if (b.day !== 1) assert.equal(b.day, prev.day + 1);
        else if (b.month !== 1) assert.equal(b.month, prev.month + 1);
        else assert.equal(b.year, prev.year + 1);
        assert.equal(b.weekday, (prev.weekday + 1) % 7);
        prev = b;
      }
    });
  }

  it('random days across the whole supported range round-trip', () => {
    const r = rng(42);
    for (let i = 0; i < 20_000; i++) {
      const d = Math.floor(r() * (MAX_DAYS - MIN_DAYS + 1)) + MIN_DAYS;
      for (const variant of CALENDAR_VARIANTS) {
        const b = daysToBangla(d, { variant });
        const g = banglaToGregorian(b, { variant });
        assert.equal(daysFromCivil(g.year, g.month, g.day), d);
        assert.deepEqual(gregorianToBangla(g, { variant }), b);
      }
    }
  });

  it('works at the edges of the range and rejects dates outside it', () => {
    assert.deepEqual(banglaToGregorian({ year: MIN_YEAR, month: 1, day: 1 }), {
      year: 594,
      month: 4,
      day: 14,
    });
    assert.deepEqual(banglaToGregorian({ year: MAX_YEAR, month: 12, day: 30 }), {
      year: 10593,
      month: 4,
      day: 13,
    });
    assert.throws(() => daysToBangla(MIN_DAYS - 1), RangeError);
    assert.throws(() => daysToBangla(MAX_DAYS + 1), RangeError);
    assert.throws(() => gregorianToBangla({ year: 594, month: 4, day: 13 }), RangeError);
  });
});

describe('year structure', () => {
  it('month lengths add up to the distance between two Pohela Boishakhs', () => {
    for (let y = MIN_YEAR; y < MAX_YEAR; y += 7) {
      for (const variant of CALENDAR_VARIANTS) {
        const total = monthLengths(y, { variant }).reduce((a, b) => a + b, 0);
        assert.equal(total, yearStartDays(y + 1) - yearStartDays(y), `${variant} ${y}`);
        assert.equal(total, daysInYear(y));
      }
    }
  });

  it('dayOfYear counts from 1 Boishakh', () => {
    assert.equal(gregorianToBangla({ year: 2026, month: 4, day: 14 }).dayOfYear, 1);
    assert.equal(gregorianToBangla({ year: 2027, month: 4, day: 13 }).dayOfYear, 365);
    assert.equal(gregorianToBangla({ year: 2024, month: 4, day: 13 }).dayOfYear, 366);
  });
});

describe('date arithmetic', () => {
  it('addDays crosses months and years', () => {
    const d = addDays({ year: 1432, month: 12, day: 30 }, 1);
    assert.deepEqual([d.year, d.month, d.day], [1433, 1, 1]);
    const back = addDays({ year: 1433, month: 1, day: 1 }, -1);
    assert.deepEqual([back.year, back.month, back.day], [1432, 12, 30]);
    assert.throws(() => addDays({ year: 1433, month: 1, day: 1 }, 0.5), RangeError);
  });

  it('addMonths clamps the day', () => {
    const d = addMonths({ year: 1433, month: 6, day: 31 }, 1);
    assert.deepEqual([d.year, d.month, d.day], [1433, 7, 30]);
    const f = addMonths({ year: 1433, month: 10, day: 30 }, 1);
    assert.deepEqual([f.month, f.day], [11, 29]);
    const y = addMonths({ year: 1433, month: 12, day: 1 }, 13);
    assert.deepEqual([y.year, y.month, y.day], [1435, 1, 1]);
    const n = addMonths({ year: 1433, month: 1, day: 5 }, -1);
    assert.deepEqual([n.year, n.month, n.day], [1432, 12, 5]);
  });

  it('diffDays agrees with addDays', () => {
    const r = rng(3);
    for (let i = 0; i < 500; i++) {
      const a = daysToBangla(yearStartDays(1400) + Math.floor(r() * 20_000));
      const n = Math.floor(r() * 4000) - 2000;
      assert.equal(diffDays(a, addDays(a, n)), n);
    }
  });
});
