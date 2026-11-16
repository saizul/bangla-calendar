// Known dates checked against the sources listed in the README:
// - teachers.gov.bd (16 Oct 2019, quoting Bangla Academy), The Financial
//   Express (Oct 2019) and the Dhaka Tribune (22 Oct 2019) on the revised
//   calendar: Boishakh to Ashwin have 31 days, Falgun 29 (30 in a leap year,
//   30 in 2020), 21 February = 8 Falgun, 26 March = 12 Choitro, 16 December =
//   1 Poush, 8 May = 25 Boishakh, 25 May = 11 Joishtho; from 1426 BS Ashwin
//   has 31 days instead of 30.
// - Wikipedia, "Bangladeshi national calendar": month start dates from 2019,
//   the previous month lengths, and Kartik starting on Thursday 17 October 2019.
// - Prothom Alo (16 Apr 2017): under the previous calendar Falgun had 30 days
//   (31 in a Gregorian leap year) and 21 February fell on 9 Falgun.
// - The Daily Star (13 Feb 2020): Pohela Falgun now falls on 14 February.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  banglaToGregorian,
  daysInMonth,
  formatBangla,
  gregorianToBangla,
  isLeapYear,
  monthLengths,
  toBangla,
  toGregorian,
} from '../src/index.js';

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030, 2036, 2040, 2050, 2100];

function bn(year: number, month: number, day: number) {
  const d = gregorianToBangla({ year, month, day });
  return { year: d.year, month: d.month, day: d.day };
}

describe('revised calendar anchors', () => {
  it('14 April is 1 Boishakh, and the Bangla year is the Gregorian year minus 593', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 4, 14), { year: y - 593, month: 1, day: 1 }, String(y));
    assert.deepEqual(bn(2026, 4, 14), { year: 1433, month: 1, day: 1 });
    assert.equal(formatBangla(bn(2026, 4, 14)), '১ বৈশাখ ১৪৩৩');
  });

  it('13 April is the last day (30 Choitro) of the previous year', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 4, 13), { year: y - 594, month: 12, day: 30 }, String(y));
  });

  it('21 February is 8 Falgun (Shaheed Dibosh)', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 2, 21), { year: y - 594, month: 11, day: 8 }, String(y));
  });

  it('26 March is 12 Choitro (Independence Day)', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 3, 26), { year: y - 594, month: 12, day: 12 }, String(y));
  });

  it('16 December is 1 Poush (Victory Day)', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 12, 16), { year: y - 593, month: 9, day: 1 }, String(y));
  });

  it('14 February is 1 Falgun (Pohela Falgun)', () => {
    for (const y of YEARS) assert.deepEqual(bn(y, 2, 14), { year: y - 594, month: 11, day: 1 }, String(y));
  });

  it('8 May is 25 Boishakh and 25 May is 11 Joishtho', () => {
    for (const y of YEARS) {
      assert.deepEqual(bn(y, 5, 8), { year: y - 593, month: 1, day: 25 }, String(y));
      assert.deepEqual(bn(y, 5, 25), { year: y - 593, month: 2, day: 11 }, String(y));
    }
  });

  it('every month starts on the date in the published table', () => {
    const starts: [number, number][] = [
      [4, 14],
      [5, 15],
      [6, 15],
      [7, 16],
      [8, 16],
      [9, 16],
      [10, 17],
      [11, 16],
      [12, 16],
      [1, 15],
      [2, 14],
      [3, 15],
    ];
    for (const by of [1426, 1427, 1430, 1433, 1440]) {
      starts.forEach(([gm, gd], i) => {
        const g = banglaToGregorian({ year: by, month: i + 1, day: 1 });
        const gy = by + 593 + (i >= 9 ? 1 : 0);
        assert.deepEqual(g, { year: gy, month: gm, day: gd }, `${by}-${i + 1}`);
      });
    }
  });

  it('Kartik 1426 began on Thursday 17 October 2019', () => {
    const d = toBangla('2019-10-17');
    assert.deepEqual([d.year, d.month, d.day, d.weekday], [1426, 7, 1, 4]);
  });

  it('today (16 November 2026) is 1 Ogrohayon 1433, a Monday', () => {
    const d = toBangla('2026-11-16');
    assert.deepEqual([d.year, d.month, d.day, d.weekday], [1433, 8, 1, 1]);
    assert.equal(formatBangla(d, 'dddd, D MMMM YYYY'), 'সোমবার, ১ অগ্রহায়ণ ১৪৩৩');
  });

  it('converts the example from the docs back to Gregorian', () => {
    assert.deepEqual(toGregorian('১ বৈশাখ ১৪৩৩'), { year: 2026, month: 4, day: 14 });
  });
});

describe('month lengths and leap years', () => {
  it('first six months have 31 days, Kartik to Magh and Choitro 30', () => {
    assert.deepEqual(monthLengths(1433), [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29, 30]);
  });

  it('Falgun has 30 days when its February has 29 days', () => {
    // Falgun 1426 spans February 2020, Falgun 1430 February 2024.
    for (const y of [1426, 1430, 1434, 1438, 1406]) {
      assert.equal(isLeapYear(y), true, String(y));
      assert.equal(daysInMonth(y, 11), 30, String(y));
    }
    for (const y of [1427, 1428, 1429, 1431, 1432, 1433]) {
      assert.equal(isLeapYear(y), false, String(y));
      assert.equal(daysInMonth(y, 11), 29, String(y));
    }
  });

  it('follows the Gregorian century rule: 2100 is not a leap year, 2000 is', () => {
    assert.equal(isLeapYear(1506), false); // Falgun in 2100
    assert.equal(isLeapYear(1406), true); // Falgun in 2000
    assert.equal(isLeapYear(2006), false); // Falgun in 2600, not a leap year
    assert.equal(isLeapYear(1806), true); // Falgun in 2400
  });

  it('29 February is 16 Falgun and 30 Falgun ends the month in leap years', () => {
    assert.deepEqual(bn(2024, 2, 29), { year: 1430, month: 11, day: 16 });
    assert.deepEqual(bn(2024, 3, 14), { year: 1430, month: 11, day: 30 });
    assert.deepEqual(bn(2025, 3, 14), { year: 1431, month: 11, day: 29 });
    for (const y of YEARS)
      assert.deepEqual(bn(y, 3, 15), { year: y - 594, month: 12, day: 1 }, `1 Choitro ${y}`);
  });
});

describe('the previous (pre-2019) calendar and the historical variant', () => {
  it('has five 31-day months and a 30/31-day Falgun', () => {
    assert.deepEqual(
      monthLengths(1424, { variant: 'pre-2019' }),
      [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30, 30],
    );
    assert.deepEqual(
      monthLengths(1422, { variant: 'pre-2019' }),
      [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 31, 30],
    );
  });

  it('put 21 February on 9 Falgun', () => {
    for (const y of [2010, 2015, 2017, 2018, 2019]) {
      const d = gregorianToBangla({ year: y, month: 2, day: 21 }, { variant: 'historical' });
      assert.deepEqual([d.month, d.day], [11, 9], String(y));
    }
  });

  it('put Pohela Falgun on 13 February', () => {
    for (const y of [2010, 2015, 2016, 2017, 2018, 2019]) {
      const d = gregorianToBangla({ year: y, month: 2, day: 13 }, { variant: 'historical' });
      assert.deepEqual([d.month, d.day], [11, 1], String(y));
    }
  });

  it('switches to the revised rules in 1426, the first year Ashwin had 31 days', () => {
    assert.equal(daysInMonth(1425, 6, { variant: 'historical' }), 30);
    assert.equal(daysInMonth(1426, 6, { variant: 'historical' }), 31);
    // Both rule sets agree from 1 Boishakh to 31 Bhadro 1426 (14 April to 16 September 2019).
    for (const day of [
      { month: 1, day: 1 },
      { month: 5, day: 31 },
    ]) {
      assert.deepEqual(
        banglaToGregorian({ year: 1426, ...day }, { variant: 'pre-2019' }),
        banglaToGregorian({ year: 1426, ...day }, { variant: 'revised' }),
      );
    }
  });

  it('keeps 14 April as 1 Boishakh in every variant', () => {
    for (const variant of ['revised', 'pre-2019', 'historical'] as const) {
      for (const y of [1990, 2000, 2018, 2019, 2024]) {
        const d = gregorianToBangla({ year: y, month: 4, day: 14 }, { variant });
        assert.deepEqual([d.year, d.month, d.day], [y - 593, 1, 1], `${variant} ${y}`);
      }
    }
  });
});
