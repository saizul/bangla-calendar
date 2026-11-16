import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import * as esm from '../src/index.js';

const require = createRequire(import.meta.url);

describe('package', () => {
  it('the CommonJS build exposes the same API', () => {
    const cjs = require('../cjs/index.js') as typeof esm;
    assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
    assert.equal(cjs.format(cjs.toBangla('2026-04-14')), '১ বৈশাখ ১৪৩৩');
  });

  it('the CommonJS folder is marked as commonjs', () => {
    const pkg = JSON.parse(readFileSync(new URL('../cjs/package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.type, 'commonjs');
  });

  it('has no runtime dependencies, versions agree and the CLI has a shebang', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.version, esm.VERSION);
    assert.equal(pkg.sideEffects, false);
    assert.ok(
      readFileSync(new URL('../esm/cli.js', import.meta.url), 'utf8').startsWith('#!/usr/bin/env node'),
    );
  });

  it('the library does not use Intl, String#normalize or locale methods', () => {
    const dir = new URL('../esm/', import.meta.url);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.js') || file === 'cli.js') continue;
      // Comments may mention Intl; only code counts.
      const src = readFileSync(new URL(file, dir), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      assert.doesNotMatch(src, /\bIntl\b|\.normalize\(|toLocale|localeCompare/, file);
    }
  });

  it('works when Intl is missing', () => {
    const saved = globalThis.Intl;
    try {
      // @ts-expect-error simulating a runtime without Intl
      delete globalThis.Intl;
      assert.equal(typeof (globalThis as { Intl?: unknown }).Intl, 'undefined');
      const d = esm.toBangla('2026-11-16');
      assert.equal(esm.formatBangla(d, 'dddd, Do MMMM YYYY'), 'সোমবার, ১লা অগ্রহায়ণ ১৪৩৩');
      assert.deepEqual(esm.toGregorian('১লা অগ্রহায়ণ ১৪৩৩'), { year: 2026, month: 11, day: 16 });
    } finally {
      globalThis.Intl = saved;
    }
  });
});
