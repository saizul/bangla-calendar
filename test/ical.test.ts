import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { daysInYear, escapeICalText, foldICalLine, toICalendar } from '../src/index.js';

const NOW = Date.UTC(2026, 10, 16, 6, 7, 8);

function unfold(text: string): string[] {
  return text.replace(/\r\n /g, '').split('\r\n');
}

function events(text: string): string[][] {
  const out: string[][] = [];
  let current: string[] | undefined;
  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') current = [];
    else if (line === 'END:VEVENT') {
      out.push(current!);
      current = undefined;
    } else current?.push(line);
  }
  return out;
}

function prop(event: string[], name: string): string | undefined {
  return event.find((l) => l.startsWith(`${name}:`) || l.startsWith(`${name};`))?.replace(/^[^:]*:/, '');
}

describe('iCalendar export', () => {
  it('has a valid calendar envelope with CRLF line endings', () => {
    const text = toICalendar(1433, { now: NOW, include: 'events' });
    const lines = unfold(text);
    assert.equal(lines[0], 'BEGIN:VCALENDAR');
    assert.ok(lines.includes('VERSION:2.0'));
    assert.ok(lines.some((l) => l.startsWith('PRODID:-//saizul//bangla-calendar ')));
    assert.equal(lines.at(-2), 'END:VCALENDAR');
    assert.ok(text.endsWith('END:VCALENDAR\r\n'));
    assert.doesNotMatch(text.replace(/\r\n/g, ''), /\n/);
  });

  it('writes one all-day event per Bangla day', () => {
    const list = events(toICalendar(1433, { now: NOW, include: 'days' }));
    assert.equal(list.length, daysInYear(1433));
    const first = list[0]!;
    assert.equal(prop(first, 'DTSTART'), '20260414');
    assert.equal(prop(first, 'DTEND'), '20260415');
    assert.equal(prop(first, 'SUMMARY'), '১ বৈশাখ ১৪৩৩');
    assert.equal(prop(first, 'UID'), 'bangla-1433-01-01@bangla-calendar');
    assert.equal(prop(first, 'DTSTAMP'), '20261116T060708Z');
    assert.ok(first.includes('DTSTART;VALUE=DATE:20260414'));
    const last = list.at(-1)!;
    assert.equal(prop(last, 'DTSTART'), '20270413');
    const uids = new Set(list.map((e) => prop(e, 'UID')));
    assert.equal(uids.size, list.length);
  });

  it('lists the national days with their Bangla date', () => {
    const list = events(toICalendar(1432, { now: NOW, include: 'events', locale: 'en' }));
    assert.equal(list.length, 7);
    const language = list.find((e) => prop(e, 'UID') === 'bangla-1432-mother-language-day@bangla-calendar')!;
    assert.equal(prop(language, 'DTSTART'), '20260221');
    assert.equal(prop(language, 'SUMMARY'), "Language Martyrs' Day and International Mother Language Day");
    assert.equal(prop(language, 'DESCRIPTION'), '8 Falgun 1432');
    assert.equal(prop(language, 'CATEGORIES'), 'HOLIDAY');
  });

  it('covers several years, both kinds by default, with custom patterns and digits', () => {
    const text = toICalendar(1432, { now: NOW, years: 2, pattern: 'Do MMMM', digits: 'latn' });
    const list = events(text);
    assert.equal(list.length, daysInYear(1432) + daysInYear(1433) + 14);
    assert.equal(prop(list[0]!, 'SUMMARY'), '1la বৈশাখ'.replace('1la', '1লা'));
    assert.ok(unfold(text).includes('X-WR-CALNAME:বাংলা ক্যালেন্ডার'));
  });

  it('is reproducible with a fixed time stamp', () => {
    assert.equal(toICalendar(1433, { now: NOW }), toICalendar(1433, { now: new Date(NOW) }));
  });

  it('rejects bad arguments', () => {
    assert.throws(() => toICalendar(0), RangeError);
    assert.throws(() => toICalendar(1433, { years: 0 }), RangeError);
    assert.throws(() => toICalendar(9999, { years: 2 }), RangeError);
    assert.throws(() => toICalendar(1433, { include: 'all' as 'both' }), RangeError);
    assert.throws(() => toICalendar(1433, { now: Number.NaN }), RangeError);
  });
});

describe('iCalendar helpers', () => {
  it('escapes text values', () => {
    assert.equal(escapeICalText('a, b; c\\d\ne'), 'a\\, b\\; c\\\\d\\ne');
  });

  it('folds at 75 octets without splitting UTF-8 sequences', () => {
    assert.equal(foldICalLine('short'), 'short');
    const line = `SUMMARY:${'বাংলা'.repeat(20)}`;
    const folded = foldICalLine(line);
    const parts = folded.split('\r\n');
    assert.ok(parts.length > 1);
    for (const [i, part] of parts.entries()) {
      assert.ok(Buffer.byteLength(part, 'utf8') <= 75, `line ${i} is too long`);
      if (i > 0) assert.ok(part.startsWith(' '));
    }
    assert.equal(folded.replace(/\r\n /g, ''), line);
    const ascii = foldICalLine('X'.repeat(150));
    assert.deepEqual(
      ascii.split('\r\n').map((p) => p.length),
      [75, 75, 2],
    );
  });
});
