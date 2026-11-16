// Run after `npm run build`:  node examples/basic.mjs
import { daysInMonth, formatBangla, isLeapYear, today, toBangla, toGregorian } from '../dist/esm/index.js';

const now = today(); // Bangladesh time
console.log('Today:', formatBangla(now, 'dddd, Do MMMM YYYY E'));
console.log('Season:', formatBangla(now, 'R'), '/', formatBangla(now, 'R', { locale: 'en' }));

const victory = toBangla('2026-12-16');
console.log('16 December 2026 =', formatBangla(victory)); // ১ পৌষ ১৪৩৩

console.log('Pohela Boishakh 1434 =', toGregorian('১ বৈশাখ ১৪৩৪')); // { year: 2027, month: 4, day: 14 }

for (const year of [1430, 1431, 1432, 1433]) {
  console.log(`${year}: Falgun has ${daysInMonth(year, 11)} days${isLeapYear(year) ? ' (leap year)' : ''}`);
}
