#!/usr/bin/env node
// Rebuilds data/zipcodes.tsv from upstream sources. Run through scripts/fetch.sh,
// which downloads the inputs into this directory first.
//
// Sources, in priority order:
//   1. GeoNames US.txt, the bulk of the dataset.
//   2. GeoNames territory files (GU, VI, PR, AS, MP, PW, FM), which are published as
//      separate country files.
//   3. USPS ZIP_Locale_Detail.xlsx: ZIP codes that GeoNames lacks and we don't
//      have yet are geocoded through the US Census Bureau geocoder using the
//      post office address.
//   4. Records already in data/zipcodes.tsv that USPS still lists but GeoNames
//      doesn't have (i.e. ZIP codes geocoded by an earlier run).
// Coordinates in data/overrides.tsv then replace the upstream ones.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

const here = new URL('./', import.meta.url);
const dataFile = new URL('../data/zipcodes.tsv', import.meta.url);
const HEADER = 'zip\tlatitude\tlongitude\tcity\tstate';
const REQUESTS_PER_SECOND = 5;

const clean = (str) => str.replace(/"/g, '').trimStart();

const ucfirst = (str) =>
    str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(' ');

// --- 1. existing records ---------------------------------------------------

/** @type {Map<string, {zip: string, latitude: number, longitude: number, city: string, state: string}>} */
const existing = new Map();
for (const line of readFileSync(dataFile, 'utf8').split('\n').slice(1)) {
    if (!line) continue;
    const [zip, latitude, longitude, city, state] = line.split('\t');
    existing.set(zip, { zip, latitude: Number(latitude), longitude: Number(longitude), city, state });
}

const zips = new Map();

// --- USPS rows and the Census geocoder ----------------------------------------------

async function geocode(row) {
    const address = `${row['PHYSICAL DELV ADDR']} ${row['PHYSICAL CITY']} ${row['DELIVERY ZIPCODE']}`;
    const url =
        'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
        `?address=${encodeURIComponent(address)}&benchmark=2020&format=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const match = (await response.json()).result.addressMatches[0];
        if (!match) {
            return undefined;
        }
        return {
            zip: row['DELIVERY ZIPCODE'],
            // Four decimals (about 11 m), the same precision GeoNames uses.
            latitude: Number(match.coordinates.y.toFixed(4)),
            longitude: Number(match.coordinates.x.toFixed(4)),
            city: ucfirst(row['PHYSICAL CITY']),
            state: row['PHYSICAL STATE'],
        };
    } catch (error) {
        console.error(`Could not geocode ${row['DELIVERY ZIPCODE']}:`, error.message);
        return undefined;
    }
}

// USPS switched from .xls to .xlsx in 2026; fetch.sh downloads whichever exists.
const spreadsheet = ['ZIP_Locale_Detail.xlsx', 'ZIP_Locale_Detail.xls']
    .map((name) => new URL(name, here))
    .find((url) => existsSync(url));
if (!spreadsheet) {
    throw new Error('ZIP_Locale_Detail.xlsx not found; run scripts/fetch.sh');
}
const workbook = xlsx.readFile(spreadsheet.pathname);
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
// Text cells are space-padded to a fixed width. Spreadsheet cells can also come
// back as numbers, which lose their leading zeros (801 instead of '00801').
// Normalize once so every later step sees clean values and dataset keys.
for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
            row[key] = value.trim().replace(/\s+/g, ' ');
        }
    }
    row['DELIVERY ZIPCODE'] = String(row['DELIVERY ZIPCODE']).trim().padStart(5, '0');
}
// --- 2 & 3. GeoNames --------------------------------------------------------

// `state` overrides the admin code column, which is a FIPS code (not a USPS
// abbreviation) in the territory files.
function mergeGeonames(file, state) {
    const url = new URL(file, here);
    if (!existsSync(url)) {
        return;
    }
    for (const line of readFileSync(url, 'utf8').split('\n')) {
        const dt = line.split('\t');
        if (dt.length < 11 || !dt[1]) continue;
        const zip = clean(dt[1]);
        const recordState = state ?? clean(dt[4]);
        if (zips.has(zip) || !recordState) continue;
        zips.set(zip, {
            zip,
            latitude: Number(clean(dt[9])),
            longitude: Number(clean(dt[10])),
            city: ucfirst(clean(dt[2])),
            state: recordState,
        });
    }
}

mergeGeonames('US.txt');
mergeGeonames('GU.txt', 'GU');
mergeGeonames('VI.txt', 'VI');
mergeGeonames('PR.txt', 'PR');
mergeGeonames('AS.txt', 'AS');
mergeGeonames('MP.txt', 'MP');
mergeGeonames('PW.txt', 'PW');
mergeGeonames('FM.txt', 'FM');

// --- Census geocoder for what GeoNames lacks ----------------------------------

// Only ZIP codes that neither GeoNames nor an earlier run has coordinates for,
// so running the refresh twice gives the same file.
const missing = rows.filter((row) => !zips.has(row['DELIVERY ZIPCODE']) && !existing.has(row['DELIVERY ZIPCODE']));
console.log(`${missing.length} USPS rows have no coordinates yet; geocoding…`);

let geocoded = 0;
for (let i = 0; i < missing.length; i += REQUESTS_PER_SECOND) {
    const batch = missing.slice(i, i + REQUESTS_PER_SECOND);
    const [results] = await Promise.all([
        Promise.all(batch.map(geocode)),
        new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    for (const record of results) {
        if (record && !zips.has(record.zip)) {
            zips.set(record.zip, record);
            geocoded++;
        }
    }
}

// Keep earlier geocoding results for ZIP codes USPS still lists.
const uspsZips = new Set(rows.map((row) => row['DELIVERY ZIPCODE']));
let retained = 0;
for (const [zip, record] of existing) {
    if (!zips.has(zip) && uspsZips.has(zip)) {
        zips.set(zip, record);
        retained++;
    }
}

// --- coordinate overrides ---------------------------------------------------

// data/overrides.tsv holds hand-checked coordinates for ZIP codes where the
// upstream value is known to be wrong. Each row says why.
const overridesFile = new URL('../data/overrides.tsv', import.meta.url);
let overridden = 0;
for (const line of readFileSync(overridesFile, 'utf8').split('\n').slice(1)) {
    if (!line) continue;
    const [zip, latitude, longitude] = line.split('\t');
    const record = zips.get(zip);
    if (!record) {
        console.warn(`Override for ${zip} skipped: not in the dataset.`);
        continue;
    }
    zips.set(zip, { ...record, latitude: Number(latitude), longitude: Number(longitude) });
    overridden++;
}

// --- write ------------------------------------------------------------------

// Sorted by ZIP code so the file doesn't reshuffle when an upstream source
// changes its row order, which keeps the diff of a refresh reviewable.
const valid = [...zips.values()]
    .filter(
        (r) =>
            /^\d{5}$/.test(r.zip) &&
            Number.isFinite(r.latitude) &&
            Number.isFinite(r.longitude) &&
            r.city &&
            /^[A-Z]{2}$/.test(r.state),
    )
    .sort((a, b) => (a.zip < b.zip ? -1 : 1));

writeFileSync(
    dataFile,
    HEADER + '\n' + valid.map((r) => [r.zip, r.latitude, r.longitude, r.city, r.state].join('\t')).join('\n') + '\n',
);
console.log(
    `Wrote ${valid.length} ZIP codes (${geocoded} newly geocoded, ${retained} retained from earlier runs, ${overridden} overridden, ${zips.size - valid.length} dropped as malformed; ` +
        `previously ${existing.size}).`,
);
