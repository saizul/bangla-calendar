import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from '../src/cli/run.js';

// 00:30 on Monday 16 November 2026 in Dhaka.
const NOW = Date.UTC(2026, 10, 15, 18, 30);

async function cli(...args: string[]) {
  let stdout = '';
  let stderr = '';
  const code = await run(args, {
    stdout: (t) => {
      stdout += t;
    },
    stderr: (t) => {
      stderr += t;
    },
    now: () => NOW,
  });
  return { code, stdout, stderr };
}

describe('cli', () => {
  it('prints today by default', async () => {
    const r = await cli();
    assert.equal(r.code, 0);
    assert.equal(r.stdout, 'সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত\n');
    assert.equal((await cli('today')).stdout, r.stdout);
    assert.equal((await cli('today', '--zone', 'UTC')).stdout, 'রবিবার, ৩০ কার্তিক ১৪৩৩ বঙ্গাব্দ, হেমন্ত\n');
  });

  it('converts Gregorian to Bangla', async () => {
    assert.equal((await cli('convert', '2026-11-16')).stdout, 'সোমবার, ১ অগ্রহায়ণ ১৪৩৩ বঙ্গাব্দ, হেমন্ত\n');
    assert.equal((await cli('2026-02-21', '--en')).stdout, 'Saturday, 8 Falgun 1432 BS, Spring\n');
    assert.equal((await cli('convert', '2026-03-26', '-f', 'Do MMMM YYYY')).stdout, '১২ই চৈত্র ১৪৩২\n');
    assert.equal(
      (await cli('convert', '2026-04-14', '--locale', 'bn-Latn')).stdout,
      'Mongolbar, 1 Boishakh 1433 Bongabdo, Grishmo\n',
    );
    assert.equal(
      (await cli('convert', '2026-04-14', '--digits', 'latn', '-f', 'D MMMM YYYY')).stdout,
      '1 বৈশাখ 1433\n',
    );
  });

  it('converts Bangla to Gregorian', async () => {
    assert.equal((await cli('convert', '--to-gregorian', '১ বৈশাখ ১৪৩৩')).stdout, '2026-04-14 (মঙ্গলবার)\n');
    assert.equal((await cli('--to-gregorian', '1 Boishakh 1433', '--en')).stdout, '2026-04-14 (Tuesday)\n');
    assert.equal((await cli('convert', '৮ই ফাল্গুন ১৪৩২')).stdout, '2026-02-21 (শনিবার)\n');
    assert.equal(
      (await cli('-g', '1 Falgun 1424', '--variant', 'historical', '--en')).stdout,
      '2018-02-13 (Tuesday)\n',
    );
  });

  it('prints JSON', async () => {
    const r = JSON.parse((await cli('convert', '2026-11-16', '--json')).stdout);
    assert.deepEqual(r.bangla, {
      year: 1433,
      month: 8,
      day: 1,
      weekday: 1,
      dayOfYear: 217,
      season: 3,
      leapYear: false,
    });
    assert.equal(r.formatted, '১ অগ্রহায়ণ ১৪৩৩');
    assert.equal(r.gregorian, '2026-11-16');
    assert.equal(r.names.season, 'হেমন্ত');
    const g = JSON.parse((await cli('-g', '১ বৈশাখ ১৪৩৩', '--json')).stdout);
    assert.equal(g.gregorian, '2026-04-14');
  });

  it('shows a month and the events of a year', async () => {
    const m = await cli('month');
    assert.match(m.stdout, /^অগ্রহায়ণ ১৪৩৩\n/);
    assert.match(m.stdout, /\[১\]/);
    const f = await cli('month', '1430', '11', '--en');
    assert.match(f.stdout, /^Falgun 1430\n/);
    assert.match(f.stdout, /\b30$/m);
    const e = await cli('events', '1433', '--en');
    assert.match(e.stdout, /^2026-04-14 {2}1 Boishakh 1433 {2}Pohela Boishakh/);
    assert.match(e.stdout, /2027-02-21 {2}8 Falgun 1433 {2}Language Martyrs' Day/);
    const j = JSON.parse((await cli('events', '--json')).stdout);
    assert.equal(j.length, 7);
  });

  it('prints help and version', async () => {
    assert.match((await cli('--help')).stdout, /^Usage: bangla-calendar/);
    assert.equal((await cli('-v')).stdout, '0.1.0\n');
  });

  it('exits 2 on bad input', async () => {
    for (const args of [
      ['convert'],
      ['convert', '2026-02-30'],
      ['convert', 'hello world'],
      ['-g', '৩০ ফাল্গুন ১৪৩৩'],
      ['frobnicate'],
      ['--locale', 'fr'],
      ['--variant', 'west-bengal'],
      ['--zone', 'Mars'],
      ['--bogus'],
      ['today', 'extra'],
      ['month', 'x'],
    ]) {
      const r = await cli(...args);
      assert.equal(r.code, 2, args.join(' '));
      assert.match(r.stderr, /^bangla-calendar: /);
    }
  });
  it('writes an iCalendar file', async () => {
    const r = await cli('ics', '1433', '--events-only', '--en');
    assert.equal(r.code, 0);
    assert.ok(r.stdout.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.equal(r.stdout.match(/BEGIN:VEVENT/g)?.length, 7);
    assert.match(r.stdout, /SUMMARY:Victory Day\r\n/);
    assert.match(r.stdout, /DTSTAMP:20261115T183000Z/);
    const days = await cli('ics', '--days-only', '-f', 'D MMMM');
    assert.equal(days.stdout.match(/BEGIN:VEVENT/g)?.length, 365);
    assert.match(days.stdout, /SUMMARY:১ বৈশাখ\r\n/);
    assert.equal((await cli('ics', '1433', '2')).stdout.match(/BEGIN:VEVENT/g)?.length, 365 + 366 + 14); // 1434 is a leap year
  });

  it('rejects bad ics arguments', async () => {
    assert.equal((await cli('ics', '--events-only', '--days-only')).code, 2);
    assert.equal((await cli('ics', '1433', '0')).code, 2);
    assert.equal((await cli('ics', '1', '2', '3')).code, 2);
  });
});
