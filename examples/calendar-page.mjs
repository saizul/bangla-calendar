// Prints a month view and the fixed national days of the current Bangla year.
// Run after `npm run build`:  node examples/calendar-page.mjs
import { eventsInYear, formatBangla, formatIsoDate, renderMonth, today } from '../dist/esm/index.js';

const now = today();
process.stdout.write(renderMonth(now.year, now.month, { highlight: now.day }));
console.log();
for (const { event, date, gregorian } of eventsInYear(now.year)) {
  console.log(`${formatIsoDate(gregorian)}  ${formatBangla(date, 'Do MMMM')}  ${event.nameBn}`);
}
