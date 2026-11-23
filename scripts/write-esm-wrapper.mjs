#!/usr/bin/env node
// Writes the ES module entry points next to the CommonJS build.
//
// The ESM entry re-exports the CommonJS build instead of being compiled separately,
// so the ~1.5 MB dataset ships (and loads) only once however the package is imported.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const cjs = require('../dist/index.js');
const names = Object.keys(cjs).filter((name) => name !== 'default' && name !== '__esModule').sort();

const mjs =
    "import zipcodes from './index.js';\n\n" +
    `export const {\n${names.map((n) => `    ${n},\n`).join('')}} = zipcodes;\n\n` +
    'export default zipcodes.default;\n';

// `export { default } from './index.js'` would be wrong here: under Node16/NodeNext
// resolution the default import of a CommonJS module is its whole `module.exports`,
// which would type `zipcodes.default` as existing when it is undefined at runtime.
const dmts =
    "import cjs = require('./index.js');\n\n" +
    "export * from './index.js';\n\n" +
    'declare const zipcodes: typeof cjs.default;\n' +
    'export default zipcodes;\n';

writeFileSync(new URL('../dist/index.mjs', import.meta.url), mjs);
writeFileSync(new URL('../dist/index.d.mts', import.meta.url), dmts);
console.log(`Wrote dist/index.mjs with ${names.length} named exports`);
