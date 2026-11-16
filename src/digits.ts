// Bangla digits (U+09E6..U+09EF) and back.

export const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

const ZERO = 0x09e6;

/** Replaces ASCII digits 0-9 with Bangla digits. Other characters are kept. */
export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BANGLA_DIGITS[d.charCodeAt(0) - 48]!);
}

/** Replaces Bangla digits with ASCII digits. Other characters are kept. */
export function toLatinDigits(value: string): string {
  let out = '';
  for (const ch of value) {
    const cp = ch.charCodeAt(0);
    out += cp >= ZERO && cp <= ZERO + 9 ? String.fromCharCode(48 + cp - ZERO) : ch;
  }
  return out;
}

/** True when the string contains at least one Bangla digit. */
export function hasBanglaDigits(value: string): boolean {
  for (const ch of value) {
    const cp = ch.charCodeAt(0);
    if (cp >= ZERO && cp <= ZERO + 9) return true;
  }
  return false;
}

/** Pads a non-negative integer with leading zeros to `width` digits. */
export function pad(value: number, width: number): string {
  const s = String(Math.abs(value));
  return (value < 0 ? '-' : '') + (s.length >= width ? s : '0'.repeat(width - s.length) + s);
}
