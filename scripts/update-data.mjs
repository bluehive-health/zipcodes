#!/usr/bin/env node
// Rebuilds data/zipcodes.tsv from upstream sources. Run through scripts/fetch.sh,
// which downloads the inputs into this directory first.
//
// Sources, in priority order:
//   1. USPS ZIP_Locale_Detail.xls: ZIP codes we don't have yet are geocoded
//      through the US Census Bureau geocoder using the post office address.
//   2. GeoNames US.txt, the bulk of the dataset.
//   3. GeoNames territory files (GU, VI, PR, AS, MP), which are published as
//      separate country files.
//   4. Records already in data/zipcodes.tsv that USPS still lists but GeoNames
//      doesn't have (i.e. ZIP codes geocoded by an earlier run).
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

// --- 2. USPS + Census geocoder ----------------------------------------------

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
            zip: String(row['DELIVERY ZIPCODE']),
            latitude: match.coordinates.y,
            longitude: match.coordinates.x,
            city: ucfirst(row['PHYSICAL CITY']),
            state: row['PHYSICAL STATE'],
        };
    } catch (error) {
        console.error(`Could not geocode ${row['DELIVERY ZIPCODE']}:`, error.message);
        return undefined;
    }
}

const workbook = xlsx.readFile(new URL('ZIP_Locale_Detail.xls', here).pathname);
const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
const missing = rows.filter((row) => !existing.has(String(row['DELIVERY ZIPCODE'])));
console.log(`${missing.length} USPS rows are not in the dataset yet; geocoding…`);

for (let i = 0; i < missing.length; i += REQUESTS_PER_SECOND) {
    const batch = missing.slice(i, i + REQUESTS_PER_SECOND);
    const [results] = await Promise.all([
        Promise.all(batch.map(geocode)),
        new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    for (const record of results) {
        if (record) {
            zips.set(record.zip, record);
        }
    }
}
const geocoded = zips.size;

// --- 3 & 4. GeoNames --------------------------------------------------------

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

// Keep earlier geocoding results for ZIP codes USPS still lists.
const uspsZips = new Set(rows.map((row) => String(row['DELIVERY ZIPCODE'])));
let retained = 0;
for (const [zip, record] of existing) {
    if (!zips.has(zip) && uspsZips.has(zip)) {
        zips.set(zip, record);
        retained++;
    }
}

// --- write ------------------------------------------------------------------

const valid = [...zips.values()].filter(
    (r) =>
        /^\d{5}$/.test(r.zip) &&
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude) &&
        r.city &&
        /^[A-Z]{2}$/.test(r.state),
);

writeFileSync(
    dataFile,
    HEADER + '\n' + valid.map((r) => [r.zip, r.latitude, r.longitude, r.city, r.state].join('\t')).join('\n') + '\n',
);
console.log(
    `Wrote ${valid.length} ZIP codes (${geocoded} newly geocoded, ${retained} retained from earlier runs, ${zips.size - valid.length} dropped as malformed; ` +
        `previously ${existing.size}).`,
);
