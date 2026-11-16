// The command-line interface, written as a function so it can be tested
// without spawning a process.

import { parseArgs } from 'node:util';
import {
  type BanglaDate,
  banglaToGregorian,
  CALENDAR_VARIANTS,
  type CalendarVariant,
  daysToBangla,
  banglaToDays,
} from '../calendar.js';
import { type Zone, today, toBangla } from '../convert.js';
import { eventsInYear } from '../events.js';
import { formatBangla } from '../format.js';
import { formatIsoDate, parseIsoDate, weekdayFromDays } from '../gregorian.js';
import { renderMonth } from '../month-view.js';
import { type Locale, monthName, seasonName, WEEKDAYS_EN, weekdayName } from '../names.js';
import { parseBanglaDate } from '../parse.js';
import { toLatinDigits } from '../digits.js';
import { VERSION } from '../version.js';

export interface CliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** The current time, for tests. */
  now?: () => number;
}

export const HELP = `Usage: bangla-calendar [command] [options]

Bangla (Bongabdo) calendar of Bangladesh: today's date, conversion between
Gregorian and Bangla dates, month views and fixed national days.

Commands:
  today                          today's Bangla date (the default command)
  convert <YYYY-MM-DD>           Gregorian date to Bangla date
  convert --to-gregorian <date>  Bangla date to Gregorian, e.g. "১ বৈশাখ ১৪৩৩"
  convert <bangla date>          same as --to-gregorian when the text is not YYYY-MM-DD
  month [year] [month]           month view; year and month are Bangla (default: current)
  events [year]                  fixed national days in a Bangla year (default: current)

Options:
  -g, --to-gregorian <date>      Bangla date to convert to Gregorian
  -l, --locale <locale>          bn (default), bn-Latn (romanised) or en
      --en                       same as --locale en
  -d, --digits <digits>          bn or latn (default: bn for bn, latn otherwise)
  -f, --format <pattern>         output pattern, e.g. "D MMMM YYYY" or "dddd, Do MMMM"
      --json                     print JSON
      --variant <variant>        revised (default), pre-2019 or historical
      --zone <zone>              for "today": Asia/Dhaka (default), UTC, local or an offset in minutes
      --week-start <n>           first column of "month": 0 = Sunday (default) ... 6 = Saturday
  -h, --help                     show this help
  -v, --version                  show the version

Format tokens: YYYY YY MMMM MM M Do DD D dddd ddd d R (season) E (era); [text] is literal.
`;

class UsageError extends Error {}

const LOCALES: Locale[] = ['bn', 'bn-Latn', 'en'];

interface Ctx {
  locale: Locale;
  digits: 'bn' | 'latn';
  variant: CalendarVariant;
  pattern?: string;
  json: boolean;
}

function describe(date: BanglaDate, ctx: Ctx) {
  const gregorian = banglaToGregorian(date, { variant: ctx.variant });
  return {
    bangla: {
      year: date.year,
      month: date.month,
      day: date.day,
      weekday: date.weekday,
      dayOfYear: date.dayOfYear,
      season: date.season,
      leapYear: date.leapYear,
    },
    formatted: formatBangla(date, ctx.pattern ?? 'D MMMM YYYY', ctx),
    names: {
      month: monthName(date.month, ctx.locale),
      weekday: weekdayName(date.weekday, ctx.locale),
      season: seasonName(date.season, ctx.locale),
    },
    gregorian: formatIsoDate(gregorian),
    variant: ctx.variant,
  };
}

function banglaLine(date: BanglaDate, ctx: Ctx): string {
  return formatBangla(date, ctx.pattern ?? 'dddd, D MMMM YYYY E, R', ctx);
}

function out(io: CliIo, ctx: Ctx, value: unknown, text: string): void {
  io.stdout(ctx.json ? `${JSON.stringify(value, null, 2)}\n` : `${text}\n`);
}

/** Runs the CLI and resolves with the exit code. */
export async function run(argv: string[], io: CliIo): Promise<number> {
  try {
    return runInner(argv, io);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    io.stderr(`bangla-calendar: ${message}\n`);
    if (err instanceof UsageError) io.stderr('Run bangla-calendar --help for usage.\n');
    return 2;
  }
}

function runInner(argv: string[], io: CliIo): number {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(argv);
  } catch (err) {
    throw new UsageError(err instanceof Error ? err.message : String(err));
  }
  const { values: v, positionals } = parsed;
  if (v.help) {
    io.stdout(HELP);
    return 0;
  }
  if (v.version) {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  const locale = (v.en ? 'en' : (v.locale ?? 'bn')) as Locale;
  if (!LOCALES.includes(locale)) throw new UsageError(`--locale must be one of ${LOCALES.join(', ')}`);
  const digits = (v.digits ?? (locale === 'bn' ? 'bn' : 'latn')) as 'bn' | 'latn';
  if (digits !== 'bn' && digits !== 'latn') throw new UsageError('--digits must be bn or latn');
  const variant = (v.variant ?? 'revised') as CalendarVariant;
  if (!CALENDAR_VARIANTS.includes(variant)) {
    throw new UsageError(`--variant must be one of ${CALENDAR_VARIANTS.join(', ')}`);
  }
  let zone: Zone = 'Asia/Dhaka';
  if (v.zone !== undefined) {
    if (v.zone === 'Asia/Dhaka' || v.zone === 'UTC' || v.zone === 'local') zone = v.zone;
    else if (/^[+-]?\d+$/.test(v.zone)) zone = Number(v.zone);
    else throw new UsageError('--zone must be Asia/Dhaka, UTC, local or an offset in minutes');
  }
  const ctx: Ctx = { locale, digits, variant, json: v.json === true };
  if (v.format !== undefined) ctx.pattern = v.format;
  const now = io.now?.() ?? Date.now();
  const current = () => today({ now, zone, variant });

  const [command = v['to-gregorian'] ? 'convert' : 'today', ...args] = positionals;

  switch (command) {
    case 'today': {
      if (args.length > 0) throw new UsageError('"today" takes no arguments');
      const date = current();
      out(io, ctx, describe(date, ctx), banglaLine(date, ctx));
      return 0;
    }
    case 'convert': {
      const bnInput =
        v['to-gregorian'] ?? (args.length > 0 && !parseIsoDate(args.join(' ')) ? args.join(' ') : undefined);
      if (bnInput !== undefined) {
        if (v['to-gregorian'] && args.length > 0)
          throw new UsageError('Give either a Gregorian date or --to-gregorian');
        const parts = parseBanglaDate(bnInput, { variant });
        const days = banglaToDays(parts, { variant });
        const full = daysToBangla(days, { variant });
        const g = banglaToGregorian(parts, { variant });
        const weekday = weekdayFromDays(days);
        const text =
          ctx.pattern !== undefined
            ? formatBangla(full, ctx.pattern, ctx)
            : `${formatIsoDate(g)} (${locale === 'bn' ? weekdayName(weekday, 'bn') : WEEKDAYS_EN[weekday]})`;
        out(io, ctx, describe(full, ctx), text);
        return 0;
      }
      if (args.length !== 1)
        throw new UsageError('convert needs one date, e.g. bangla-calendar convert 2026-11-16');
      const date = toBangla(args[0]!, { variant });
      out(io, ctx, describe(date, ctx), banglaLine(date, ctx));
      return 0;
    }
    case 'month': {
      if (args.length > 2) throw new UsageError('month takes at most a year and a month');
      const now = current();
      const year = args[0] !== undefined ? int(args[0], 'year') : now.year;
      const month = args[1] !== undefined ? int(args[1], 'month') : args[0] === undefined ? now.month : 1;
      const weekStartsOn = v['week-start'] !== undefined ? int(v['week-start'], 'week-start') : 0;
      const highlight = year === now.year && month === now.month ? now.day : undefined;
      const options = { locale, digits, variant, weekStartsOn, ...(highlight ? { highlight } : {}) };
      const text = renderMonth(year, month, options).trimEnd();
      const startDays = banglaToDays({ year, month, day: 1 }, { variant });
      out(
        io,
        ctx,
        {
          year,
          month,
          start: formatIsoDate(banglaToGregorian({ year, month, day: 1 }, { variant })),
          startWeekday: weekdayFromDays(startDays),
        },
        text,
      );
      return 0;
    }
    case 'events': {
      if (args.length > 1) throw new UsageError('events takes at most a year');
      const year = args[0] !== undefined ? int(args[0], 'year') : current().year;
      const list = eventsInYear(year, { variant });
      const rows = list.map(({ event, date, gregorian }) => {
        const bn = formatBangla(date, 'D MMMM YYYY', ctx);
        const name = locale === 'bn' ? event.nameBn : event.nameEn;
        return `${formatIsoDate(gregorian)}  ${bn}  ${name}`;
      });
      out(
        io,
        ctx,
        list.map(({ event, date, gregorian }) => ({
          id: event.id,
          ...date,
          gregorian: formatIsoDate(gregorian),
          name: event.nameEn,
        })),
        rows.join('\n'),
      );
      return 0;
    }
    default: {
      // A bare date: `bangla-calendar 2026-11-16`.
      if (parseIsoDate(command)) return runInner(['convert', command, ...rest(argv, command)], io);
      throw new UsageError(`Unknown command "${command}"`);
    }
  }
}

function rest(argv: string[], command: string): string[] {
  const i = argv.indexOf(command);
  return [...argv.slice(0, i), ...argv.slice(i + 1)];
}

function int(value: string, name: string): number {
  const n = Number(toLatinDigits(value));
  if (!Number.isInteger(n)) throw new UsageError(`${name} must be a whole number, got "${value}"`);
  return n;
}

function parse(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      'to-gregorian': { type: 'string', short: 'g' },
      locale: { type: 'string', short: 'l' },
      en: { type: 'boolean' },
      digits: { type: 'string', short: 'd' },
      format: { type: 'string', short: 'f' },
      json: { type: 'boolean' },
      variant: { type: 'string' },
      zone: { type: 'string' },
      'week-start': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
}
