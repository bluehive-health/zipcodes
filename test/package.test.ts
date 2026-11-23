// Checks the published entry points (the built `dist/`), not the TypeScript source.
// `npm test` builds first.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import pkg from '../package.json';

const require = createRequire(import.meta.url);

describe('published package', () => {
    it('works with require()', () => {
        const zipcodes = require('..');
        expect(zipcodes.lookup(90210).city).toBe('Beverly Hills');
        expect(zipcodes.default.lookup).toBe(zipcodes.lookup);
    });

    it('works with import in real Node ESM', () => {
        // Run outside vitest so Node's own ESM loader resolves the package.
        const script = `
            import assert from 'node:assert/strict';
            import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
            import zipcodes, * as named from '${pkg.name}';
            const cjs = createRequire(import.meta.url)('${pkg.name}');
            assert.equal(named.lookup, cjs.lookup);
            assert.equal(zipcodes.lookup, cjs.lookup);
            assert.equal(named.codes, cjs.codes);
            assert.equal(named.lookup(90210).city, 'Beverly Hills');
            for (const name of Object.keys(cjs)) assert.ok(name in named, name);
        `;
        execFileSync(process.execPath, ['--input-type=module', '-e', script], {
            cwd: fileURLToPath(new URL('..', import.meta.url)),
            stdio: 'pipe',
        });
    });

    it('keeps the pre-9 deep import paths working', () => {
        const self = pkg.name;
        expect(require(`${self}/lib/index.js`)).toBe(require('..'));
        expect(require(`${self}/lib/states`).normalize('Illinois')).toBe('IL');
        expect(require(`${self}/states`)).toBe(require(`${self}/lib/states.js`));
        const legacy = require(`${self}/lib/codes`);
        expect(legacy.codes).toBe(require('..').codes);
        expect(legacy.stateMap.RI).toHaveLength(90);
    });

    it('points every export at a file that exists', () => {
        const targets = new Set<string>();
        const walk = (value: unknown): void => {
            if (typeof value === 'string') {
                targets.add(value);
            } else if (value && typeof value === 'object') {
                Object.values(value).forEach(walk);
            }
        };
        walk(pkg.exports);
        walk([pkg.main, pkg.module, pkg.types]);
        for (const target of targets) {
            expect(() => require.resolve(`../${target}`), target).not.toThrow();
        }
    });
});
