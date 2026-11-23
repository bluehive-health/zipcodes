/**
 * @bluehive/zipcodes: offline US ZIP code lookups.
 *
 * Every function is synchronous and works entirely from a bundled dataset:
 * no network requests, no API keys, no runtime dependencies.
 *
 * @packageDocumentation
 */
import { DATA } from './data.generated';
import * as states from './states';

/** A single US ZIP code record. */
export interface ZipCode {
    /** Five digit ZIP code, always a string so leading zeros survive (e.g. `"00801"`). */
    zip: string;
    /** Latitude in decimal degrees. */
    latitude: number;
    /** Longitude in decimal degrees. */
    longitude: number;
    /** Primary city name, e.g. `"Beverly Hills"`. */
    city: string;
    /** Two letter USPS state or territory abbreviation, e.g. `"CA"`. */
    state: string;
    /** Always `"US"`. */
    country: string;
}

/** A ZIP code together with its distance from a query point. */
export interface NearestResult {
    /** The matching ZIP code record. */
    code: ZipCode;
    /** Great-circle distance from the query point, in miles (not rounded). */
    miles: number;
}

/** A city and all of the ZIP codes that belong to it. */
export interface CityMatch {
    city: string;
    state: string;
    /** Every ZIP code for this city, in dataset order. */
    zips: string[];
}

/** Options for {@link search}. */
export interface SearchOptions {
    /** Maximum number of cities to return. Defaults to `10`. */
    limit?: number;
    /** Restrict matches to one state (name or abbreviation). */
    state?: string;
}

/** Anything accepted as a ZIP code: `"90210"`, `90210`, or ZIP+4 such as `"90210-1234"`. */
export type ZipInput = string | number;

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

const DEG_TO_RAD = 0.017453292519943295;
/** Earth radius in miles. */
const EARTH_RADIUS_MILES = 3958.56540656;
const MILES_PER_DEGREE_LATITUDE = EARTH_RADIUS_MILES * DEG_TO_RAD;
const KM_PER_MILE = 1.609344;

/**
 * Every ZIP code keyed by its five digit string.
 *
 * Treat this as read-only: the lookup functions share these objects.
 */
export const codes: Record<string, ZipCode> = {};

/** Internal: state abbreviation -> ZIP codes, in dataset order. */
const stateMap = new Map<string, string[]>();
/** Internal: records in dataset order, parallel to the coordinate arrays below. */
const list: ZipCode[] = [];

for (const line of DATA.split(';')) {
    const f = line.split('|') as [string, string, string, string, string];
    const record: ZipCode = {
        zip: f[0],
        latitude: Number(f[1]),
        longitude: Number(f[2]),
        city: f[3],
        state: f[4],
        country: 'US',
    };
    codes[record.zip] = record;
}

// `codes` iterates integer-like keys ("10001") in numeric order before the
// leading-zero keys ("00801"). Everything else follows that same order so
// results come back exactly as they did in earlier versions.
for (const zip of Object.keys(codes)) {
    const record = codes[zip] as ZipCode;
    list.push(record);
    const inState = stateMap.get(record.state);
    if (inState) {
        inState.push(zip);
    } else {
        stateMap.set(record.state, [zip]);
    }
}

// Indexes built on first use, so `require()` stays fast for simple lookups.
let trig: { lat: Float64Array; lon: Float64Array; sin: Float64Array; cos: Float64Array } | undefined;
let cityIndex: Map<string, ZipCode[]> | undefined;
let cityList: Array<{ key: string; match: CityMatch }> | undefined;

function getTrig() {
    if (!trig) {
        const n = list.length;
        trig = {
            lat: new Float64Array(n),
            lon: new Float64Array(n),
            sin: new Float64Array(n),
            cos: new Float64Array(n),
        };
        for (let i = 0; i < n; i++) {
            const record = list[i] as ZipCode;
            const latRad = record.latitude * DEG_TO_RAD;
            trig.lat[i] = record.latitude;
            trig.lon[i] = record.longitude;
            trig.sin[i] = Math.sin(latRad);
            trig.cos[i] = Math.cos(latRad);
        }
    }
    return trig;
}

function getCityIndex(): Map<string, ZipCode[]> {
    if (!cityIndex) {
        cityIndex = new Map();
        for (const record of list) {
            const key = record.state + '|' + record.city.toUpperCase();
            const bucket = cityIndex.get(key);
            if (bucket) {
                bucket.push(record);
            } else {
                cityIndex.set(key, [record]);
            }
        }
    }
    return cityIndex;
}

function resolveState(state: string): string | undefined {
    if (typeof state !== 'string') {
        return undefined;
    }
    const normalized = states.normalize(state);
    if (normalized !== undefined && stateMap.has(normalized)) {
        return normalized;
    }
    return stateMap.has(state) ? state : undefined;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Normalize user input to a five digit ZIP string, or `undefined` if it can't be one.
 *
 * - Numbers are zero-padded: `801` becomes `"00801"`.
 * - ZIP+4 is truncated: `"90210-1234"` becomes `"90210"`.
 * - Surrounding whitespace is ignored.
 *
 * This only checks the shape. Use {@link isValid} to check that the ZIP exists.
 */
export function normalizeZip(zip: ZipInput | null | undefined): string | undefined {
    if (typeof zip === 'number') {
        if (!Number.isInteger(zip) || zip < 0 || zip > 99999) {
            return undefined;
        }
        return String(zip).padStart(5, '0');
    }
    if (typeof zip !== 'string') {
        return undefined;
    }
    const match = /^\s*(\d{5})(?:[-\s]?\d{4})?\s*$/.exec(zip);
    return match ? match[1] : undefined;
}

/**
 * Look up a ZIP code.
 *
 * @returns The record, or `undefined` if the ZIP code is unknown.
 * @example
 * lookup(90210);        // { zip: '90210', city: 'Beverly Hills', state: 'CA', ... }
 * lookup('00801');      // { zip: '00801', city: 'St Thomas', state: 'VI', ... }
 * lookup('90210-1234'); // ZIP+4 works too
 * lookup('99999');      // undefined
 */
export function lookup(zip: ZipInput): ZipCode | undefined {
    const key = normalizeZip(zip);
    return key === undefined ? undefined : codes[key];
}

/**
 * Whether a ZIP code exists in the dataset.
 *
 * @example
 * isValid('90210'); // true
 * isValid('00000'); // false
 */
export function isValid(zip: ZipInput): boolean {
    return lookup(zip) !== undefined;
}

/**
 * Pick a ZIP code at random. Handy for demos, fixtures and tests.
 */
export function random(): ZipCode {
    return list[Math.floor(Math.random() * list.length)] as ZipCode;
}

/**
 * Every ZIP code in a state or territory.
 *
 * @param state Full name or USPS abbreviation, case-insensitive (`"RI"`, `"ri"`, `"Rhode Island"`).
 * @returns Matching records, or an empty array for an unknown state.
 */
export function lookupByState(state: string): ZipCode[] {
    const key = resolveState(state);
    if (key === undefined) {
        return [];
    }
    return (stateMap.get(key) as string[]).map((zip) => codes[zip] as ZipCode);
}

/**
 * Every ZIP code for a city. Always returns an array because cities often span several ZIP codes.
 *
 * @param city City name, case-insensitive.
 * @param state Full name or USPS abbreviation, case-insensitive.
 * @example
 * lookupByName('Cupertino', 'CA');      // [{ zip: '95014', ... }, { zip: '95015', ... }]
 * lookupByName('Marion', 'Illinois');   // [{ zip: '62959', ... }]
 */
export function lookupByName(city: string, state: string): ZipCode[] {
    const key = resolveState(state);
    if (key === undefined || typeof city !== 'string') {
        return [];
    }
    const matches = getCityIndex().get(key + '|' + city.trim().toUpperCase());
    return matches ? matches.slice() : [];
}

/**
 * Find cities whose name starts with `query`. Built for autocomplete.
 *
 * Matching is case-insensitive. Results are sorted by city name, then state.
 *
 * @example
 * search('san fr');                  // [{ city: 'San Francisco', state: 'CA', zips: [...] }, ...]
 * search('spring', { state: 'IL' }); // only Illinois
 */
export function search(query: string, options?: SearchOptions | null): CityMatch[] {
    options = options ?? {};
    const prefix = typeof query === 'string' ? query.trim().toUpperCase() : '';
    const limit = options.limit ?? 10;
    if (!prefix || limit <= 0) {
        return [];
    }
    let state: string | undefined;
    if (options.state != null) {
        state = resolveState(options.state);
        if (state === undefined) {
            return [];
        }
    }
    if (!cityList) {
        cityList = [];
        for (const [key, records] of getCityIndex()) {
            const first = records[0] as ZipCode;
            cityList.push({
                key: key.slice(3),
                match: { city: first.city, state: first.state, zips: records.map((r) => r.zip) },
            });
        }
        cityList.sort((a, b) =>
            a.key < b.key ? -1 : a.key > b.key ? 1 : a.match.state < b.match.state ? -1 : 1,
        );
    }
    // Binary search for the first city at or after the prefix.
    let lo = 0;
    let hi = cityList.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if ((cityList[mid] as { key: string }).key < prefix) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    const results: CityMatch[] = [];
    for (let i = lo; i < cityList.length && results.length < limit; i++) {
        const entry = cityList[i] as { key: string; match: CityMatch };
        if (!entry.key.startsWith(prefix)) {
            break;
        }
        if (state === undefined || entry.match.state === state) {
            results.push({ ...entry.match, zips: entry.match.zips.slice() });
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * Straight-line ("as the crow flies") distance between two ZIP codes, in whole miles.
 *
 * This is not driving distance.
 *
 * @returns Rounded miles, or `null` if either ZIP code is unknown.
 * @example
 * distance(62959, 90210); // 1662
 * distance(62959, 99999); // null
 */
export function distance(zipA: ZipInput, zipB: ZipInput): number | null {
    const a = lookup(zipA);
    const b = lookup(zipB);
    if (!a || !b) {
        return null;
    }
    const latA = a.latitude * DEG_TO_RAD;
    const latB = b.latitude * DEG_TO_RAD;
    const cosine =
        Math.sin(latA) * Math.sin(latB) +
        Math.cos(latA) * Math.cos(latB) * Math.cos((a.longitude - b.longitude) * DEG_TO_RAD);
    // Rounding error can push the cosine a hair past 1 for identical points.
    return Math.round(Math.acos(Math.min(1, Math.max(-1, cosine))) * EARTH_RADIUS_MILES);
}

/**
 * Great-circle distance between two coordinates, in miles (not rounded).
 *
 * @example
 * haversine(40.7484, -73.9967, 34.0901, -118.4065); // ≈ 2453
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = (lat2 - lat1) * DEG_TO_RAD;
    const dLon = (lon2 - lon1) * DEG_TO_RAD;
    const raw =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD);
    // Rounding error can push this a hair past 1 for antipodal points.
    const a = Math.min(1, Math.max(0, raw));
    return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Every ZIP code within `miles` of a ZIP code (including the ZIP code itself).
 *
 * Distances are rounded to whole miles before comparing, matching {@link distance}.
 *
 * @param zip Center of the search.
 * @param miles Radius in miles.
 * @param full Pass `true` to get full records instead of ZIP strings.
 * @returns Matches in dataset order, or an empty array if `zip` is unknown.
 * @example
 * radius(95014, 50);       // ['93901', '93902', ...]
 * radius(95014, 50, true); // [{ zip: '93901', city: 'Salinas', ... }, ...]
 */
export function radius(zip: ZipInput, miles: number, full: true): ZipCode[];
export function radius(zip: ZipInput, miles: number, full?: false): string[];
export function radius(zip: ZipInput, miles: number, full?: boolean): string[] | ZipCode[];
export function radius(zip: ZipInput, miles: number, full?: boolean): string[] | ZipCode[] {
    const center = lookup(zip);
    const limit = Number(miles);
    if (!center || Number.isNaN(limit)) {
        return [];
    }
    const { lat, lon, sin, cos } = getTrig();
    const centerLat = center.latitude * DEG_TO_RAD;
    const sinCenter = Math.sin(centerLat);
    const cosCenter = Math.cos(centerLat);
    // Cheap reject: anything further north/south than the radius can't match.
    const latitudeWindow = (limit + 1) / MILES_PER_DEGREE_LATITUDE;
    const ret: Array<string | ZipCode> = [];

    for (let i = 0; i < list.length; i++) {
        if (Math.abs((lat[i] as number) - center.latitude) > latitudeWindow) {
            continue;
        }
        const cosine =
            sinCenter * (sin[i] as number) +
            cosCenter * (cos[i] as number) * Math.cos((center.longitude - (lon[i] as number)) * DEG_TO_RAD);
        const d = Math.round(Math.acos(Math.min(1, Math.max(-1, cosine))) * EARTH_RADIUS_MILES);
        if (d <= limit) {
            const record = list[i] as ZipCode;
            ret.push(full ? record : record.zip);
        }
    }
    return ret as string[] | ZipCode[];
}

/**
 * The `limit` closest ZIP codes to a coordinate, nearest first, with distances.
 *
 * @example
 * nearest(40.715, -73.985, 3);
 * // [{ code: { zip: '10002', ... }, miles: 0.13 }, ...]
 */
export function nearest(latitude: number, longitude: number, limit = 1): NearestResult[] {
    const count = Math.min(Math.floor(limit), list.length);
    if (!(count > 0) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return [];
    }
    const { lat, lon } = getTrig();
    // Keep the best `count` candidates sorted by distance (insertion sort; `count` is small).
    const bestIndex: number[] = [];
    const bestMiles: number[] = [];
    // Once `count` candidates are found, anything further north/south than the
    // worst of them can be skipped without any trigonometry.
    let latitudeWindow = Infinity;
    for (let i = 0; i < list.length; i++) {
        if (Math.abs((lat[i] as number) - latitude) > latitudeWindow) {
            continue;
        }
        const miles = haversine(latitude, longitude, lat[i] as number, lon[i] as number);
        if (bestIndex.length === count && miles >= (bestMiles[count - 1] as number)) {
            continue;
        }
        let at = bestIndex.length;
        while (at > 0 && (bestMiles[at - 1] as number) > miles) {
            at--;
        }
        bestIndex.splice(at, 0, i);
        bestMiles.splice(at, 0, miles);
        if (bestIndex.length > count) {
            bestIndex.pop();
            bestMiles.pop();
        }
        if (bestIndex.length === count) {
            latitudeWindow = ((bestMiles[count - 1] as number) + 1) / MILES_PER_DEGREE_LATITUDE;
        }
    }
    return bestIndex.map((index, i) => ({ code: list[index] as ZipCode, miles: bestMiles[i] as number }));
}

/**
 * The ZIP code closest to a coordinate (reverse geocoding).
 *
 * @returns The nearest record, or `null` if the coordinates aren't finite numbers.
 * @example
 * lookupByCoords(36.131, -95.937); // { zip: '74114', city: 'Tulsa', state: 'OK', ... }
 */
export function lookupByCoords(latitude: number, longitude: number): ZipCode | null {
    const best = nearest(latitude, longitude, 1)[0];
    return best ? best.code : null;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

/** Convert kilometers to miles, rounded to a whole number. */
export function toMiles(kilometers: number): number {
    return Math.round(kilometers / KM_PER_MILE);
}

/** Convert miles to kilometers, rounded to a whole number. */
export function toKilometers(miles: number): number {
    return Math.round(miles * KM_PER_MILE);
}

export { states };

const zipcodes = {
    codes,
    states,
    lookup,
    isValid,
    normalizeZip,
    random,
    lookupByName,
    lookupByState,
    lookupByCoords,
    nearest,
    search,
    distance,
    haversine,
    radius,
    toMiles,
    toKilometers,
};

export default zipcodes;
