// The package also works with require(). Run after `npm run build`:
//   node examples/commonjs.cjs
const { format, parse, toBangla, toGregorian } = require('../dist/cjs/index.js');

console.log(format(toBangla('2026-04-14'))); // ১ বৈশাখ ১৪৩৩
console.log(toGregorian(parse('8 Falgun 1432'))); // { year: 2026, month: 2, day: 21 }
