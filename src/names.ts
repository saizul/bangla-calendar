// Month, weekday, season and era names in Bangla, in romanised Bangla and in
// English. Index 0 is the first month (Boishakh), Sunday, or the first season
// (Grishmo).

/** Supported name sets: Bangla script, romanised Bangla, or English where a translation exists. */
export type Locale = 'bn' | 'bn-Latn' | 'en';

export const MONTHS_BN = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
] as const;

/** Romanised month names in a common spelling. The parser also accepts other spellings. */
export const MONTHS_LATN = [
  'Boishakh',
  'Joishtho',
  'Asharh',
  'Srabon',
  'Bhadro',
  'Ashwin',
  'Kartik',
  'Ogrohayon',
  'Poush',
  'Magh',
  'Falgun',
  'Choitro',
] as const;

export const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'] as const;
export const WEEKDAYS_BN_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'] as const;
export const WEEKDAYS_LATN = [
  'Robibar',
  'Shombar',
  'Mongolbar',
  'Budhbar',
  'Brihospotibar',
  'Shukrobar',
  'Shonibar',
] as const;
export const WEEKDAYS_LATN_SHORT = [
  'Robi',
  'Shom',
  'Mongol',
  'Budh',
  'Brihospoti',
  'Shukro',
  'Shoni',
] as const;
export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
export const WEEKDAYS_EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** The six seasons (ritu). Each spans two months: Boishakh-Joishtho is Grishmo, and so on. */
export const SEASONS_BN = ['গ্রীষ্ম', 'বর্ষা', 'শরৎ', 'হেমন্ত', 'শীত', 'বসন্ত'] as const;
export const SEASONS_LATN = ['Grishmo', 'Borsha', 'Shorot', 'Hemonto', 'Sheet', 'Boshonto'] as const;
export const SEASONS_EN = ['Summer', 'Monsoon', 'Autumn', 'Late autumn', 'Winter', 'Spring'] as const;

export const ERA_BN = 'বঙ্গাব্দ';
export const ERA_LATN = 'Bongabdo';
export const ERA_EN = 'BS';

/** The name of a month (1-12). */
export function monthName(month: number, locale: Locale = 'bn'): string {
  const list = locale === 'bn' ? MONTHS_BN : MONTHS_LATN;
  const name = list[month - 1];
  if (name === undefined) throw new RangeError(`Month must be 1-12, got ${month}`);
  return name;
}

/** The name of a weekday (0 = Sunday ... 6 = Saturday). */
export function weekdayName(weekday: number, locale: Locale = 'bn', short = false): string {
  const list =
    locale === 'bn'
      ? short
        ? WEEKDAYS_BN_SHORT
        : WEEKDAYS_BN
      : locale === 'bn-Latn'
        ? short
          ? WEEKDAYS_LATN_SHORT
          : WEEKDAYS_LATN
        : short
          ? WEEKDAYS_EN_SHORT
          : WEEKDAYS_EN;
  const name = list[weekday];
  if (name === undefined) throw new RangeError(`Weekday must be 0-6, got ${weekday}`);
  return name;
}

/** The season (0-5) a month (1-12) belongs to. */
export function seasonOfMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError(`Month must be 1-12, got ${month}`);
  return Math.floor((month - 1) / 2);
}

/** The name of a season (0-5). */
export function seasonName(season: number, locale: Locale = 'bn'): string {
  const list = locale === 'bn' ? SEASONS_BN : locale === 'bn-Latn' ? SEASONS_LATN : SEASONS_EN;
  const name = list[season];
  if (name === undefined) throw new RangeError(`Season must be 0-5, got ${season}`);
  return name;
}

/** The era suffix: বঙ্গাব্দ, Bongabdo or BS. */
export function eraName(locale: Locale = 'bn'): string {
  return locale === 'bn' ? ERA_BN : locale === 'bn-Latn' ? ERA_LATN : ERA_EN;
}
