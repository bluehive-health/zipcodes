#!/usr/bin/env node
// Rough timings for the hot paths. Run with: npm run bench
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);

const loadStart = performance.now();
const zipcodes = require('../dist/index.js');
const loadMs = performance.now() - loadStart;

function time(label, iterations, fn) {
    fn(); // warm up (also builds any lazy index)
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const perCall = (performance.now() - start) / iterations;
    const pretty = perCall < 0.001 ? `${(perCall * 1e6).toFixed(0)} ns` : `${(perCall * 1000).toFixed(1)} µs`;
    console.log(`${label.padEnd(34)} ${pretty.padStart(10)} / call`);
}

console.log(`${'require()'.padEnd(34)} ${`${loadMs.toFixed(1)} ms`.padStart(10)}`);
time("lookup('90210')", 1e6, () => zipcodes.lookup('90210'));
time('distance(62959, 90210)', 1e6, () => zipcodes.distance(62959, 90210));
time("lookupByName('New York', 'NY')", 1e5, () => zipcodes.lookupByName('New York', 'NY'));
time("lookupByState('CA')", 1e4, () => zipcodes.lookupByState('CA'));
time("search('san')", 1e5, () => zipcodes.search('san'));
time('radius(95014, 50)', 2e3, () => zipcodes.radius(95014, 50));
time('lookupByCoords(40.715, -73.985)', 5e2, () => zipcodes.lookupByCoords(40.715, -73.985));
time('nearest(40.715, -73.985, 10)', 5e2, () => zipcodes.nearest(40.715, -73.985, 10));
