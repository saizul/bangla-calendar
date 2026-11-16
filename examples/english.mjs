// Romanised and English output. Run after `npm run build`:  node examples/english.mjs
import { formatBangla, parseBanglaDate, toBangla, toGregorian } from '../dist/esm/index.js';

const d = toBangla('2026-02-21');
console.log(formatBangla(d, 'dddd, Do MMMM YYYY E', { locale: 'en' })); // Saturday, 8th Falgun 1432 BS
console.log(formatBangla(d, 'dddd, D MMMM YYYY E', { locale: 'bn-Latn' })); // Shonibar, 8 Falgun 1432 Bongabdo

// Many spellings are understood.
for (const text of ['1 Baishakh 1433', 'Boishakh 1, 1433 BS', '১লা বৈশাখ, ১৪৩৩ বঙ্গাব্দ']) {
  console.log(text, '->', parseBanglaDate(text), toGregorian(text));
}
