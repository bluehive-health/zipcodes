// All copy for the site lives here. The page, the JSON-LD structured data and
// the prerendered HTML are generated from this one module, so they can't drift apart.

export const site = {
    name: '@bluehive/zipcodes',
    shortName: 'zipcodes',
    url: 'https://zipcodes.bluehive.com',
    title: 'US ZIP Code Lookup for Node.js & TypeScript | @bluehive/zipcodes',
    description:
        'Free, offline US ZIP code lookup for Node.js and TypeScript. Get city, state and coordinates for 41,000+ ZIP codes, plus distance, radius search, reverse geocoding and city autocomplete. Zero dependencies, no API key.',
    tagline: 'US ZIP code lookups that work offline',
    lede: 'City, state and coordinates for every US ZIP code, plus distance, radius search, reverse geocoding and city autocomplete. One npm install. No API key, no network calls, no dependencies.',
    install: 'npm install @bluehive/zipcodes',
    github: 'https://github.com/bluehive-health/zipcodes',
    npm: 'https://www.npmjs.com/package/@bluehive/zipcodes',
    issues: 'https://github.com/bluehive-health/zipcodes/issues',
    license: 'BSD-3-Clause',
    careers: 'https://mieweb.org/join-our-team/',
    bluehive: 'https://bluehive.com',
    zipCount: 41203,
    regionCount: 59,
    dataUpdated: 'November 2026',
} as const;

export const nav = [
    { href: '#playground', label: 'Playground' },
    { href: '#quick-start', label: 'Quick start' },
    { href: '#api', label: 'API' },
    { href: '#faq', label: 'FAQ' },
] as const;

export const highlights = [
    { value: '41,203', label: 'ZIP codes' },
    { value: '0', label: 'Dependencies' },
    { value: '36 ns', label: 'Per lookup' },
    { value: '538 kB', label: 'Install size (packed)' },
] as const;

export const features = [
    {
        title: 'Works offline',
        body: 'The whole dataset ships inside the package. Every call is synchronous and local, so there are no rate limits, no API keys, no latency and nothing to mock in tests.',
    },
    {
        title: 'TypeScript first',
        body: 'Written in TypeScript with full type definitions and JSDoc on every function. Works with import and require, in Node.js 18+, Bun, Deno and bundlers.',
    },
    {
        title: 'Fast',
        body: 'A single lookup takes about 36 nanoseconds. A 50 mile radius search across all 41,203 ZIP codes takes about 0.2 milliseconds.',
    },
    {
        title: 'Covers the territories',
        body: 'All 50 states and Washington DC, plus Puerto Rico, Guam, the US Virgin Islands, American Samoa, the Northern Mariana Islands, the Marshall Islands, Palau and Micronesia. Military (APO/FPO) ZIP codes are not included.',
    },
    {
        title: 'Forgiving input',
        body: 'Pass a string or a number, a ZIP+4 like "90210-1234", a state name or its abbreviation in any case. Leading zeros are handled for you.',
    },
    {
        title: 'Free and open source',
        body: 'BSD-3-Clause licensed. Built from public USPS, US Census Bureau and GeoNames data, and maintained by BlueHive Health.',
    },
] as const;

export const quickStart = {
    esm: `import { lookup, distance, radius } from '@bluehive/zipcodes';

lookup('90210');
// { zip: '90210', latitude: 34.0901, longitude: -118.4065,
//   city: 'Beverly Hills', state: 'CA', country: 'US' }

distance('62959', '90210'); // 1662 (miles)

radius('95014', 50);        // ['93901', '93902', ... 371 ZIP codes]`,
    cjs: `const zipcodes = require('@bluehive/zipcodes');

zipcodes.lookup('90210');
// { zip: '90210', latitude: 34.0901, longitude: -118.4065,
//   city: 'Beverly Hills', state: 'CA', country: 'US' }

zipcodes.distance('62959', '90210'); // 1662 (miles)

zipcodes.radius('95014', 50);        // ['93901', '93902', ... 371 ZIP codes]`,
    ts: `import { lookup, type ZipCode } from '@bluehive/zipcodes';

function cityFor(zip: string): string {
    const record: ZipCode | undefined = lookup(zip);
    return record ? \`\${record.city}, \${record.state}\` : 'Unknown ZIP code';
}

cityFor('00801'); // 'St Thomas, VI'
cityFor('99999'); // 'Unknown ZIP code'`,
} as const;

export interface ApiEntry {
    id: string;
    name: string;
    signature: string;
    summary: string;
    details?: string;
    example: string;
    since?: string;
}

export const api: ApiEntry[] = [
    {
        id: 'lookup',
        name: 'lookup',
        signature: 'lookup(zip: string | number): ZipCode | undefined',
        summary: 'Look up one ZIP code and get its city, state, latitude and longitude.',
        details:
            'Accepts a string or a number. ZIP+4 is truncated to five digits and numbers are zero-padded, so lookup(801) finds "00801". Returns undefined for an unknown ZIP code.',
        example: `lookup('90210');
// { zip: '90210', latitude: 34.0901, longitude: -118.4065,
//   city: 'Beverly Hills', state: 'CA', country: 'US' }

lookup('90210-1234'); // same record
lookup('99999');      // undefined`,
    },
    {
        id: 'isValid',
        name: 'isValid',
        signature: 'isValid(zip: string | number): boolean',
        summary: 'Check whether a ZIP code exists. Useful for form validation.',
        example: `isValid('90210'); // true
isValid('00000'); // false`,
        since: '9.0.0',
    },
    {
        id: 'distance',
        name: 'distance',
        signature: 'distance(zipA: string | number, zipB: string | number): number | null',
        summary: 'Straight-line distance between two ZIP codes, in whole miles.',
        details:
            'This is great-circle ("as the crow flies") distance between the two ZIP code centers, not driving distance. Returns null if either ZIP code is unknown. Convert with toKilometers().',
        example: `distance('62959', '90210');               // 1662
toKilometers(distance('62959', '90210')); // 2675
distance('62959', '99999');               // null`,
    },
    {
        id: 'radius',
        name: 'radius',
        signature: 'radius(zip: string | number, miles: number, full?: boolean): string[] | ZipCode[]',
        summary: 'Every ZIP code within a number of miles of a ZIP code.',
        details:
            'Returns ZIP code strings by default. Pass true as the third argument to get full records instead. Returns an empty array if the center ZIP code is unknown.',
        example: `radius('95014', 50);
// ['93901', '93902', '93905', ... 371 ZIP codes]

radius('62959', 5, true);
// [{ zip: '62959', city: 'Marion', state: 'IL', ... }]`,
    },
    {
        id: 'lookupByName',
        name: 'lookupByName',
        signature: 'lookupByName(city: string, state: string): ZipCode[]',
        summary: 'Every ZIP code for a city. Always returns an array, because most cities have several.',
        details: 'City and state are case-insensitive. The state can be a full name or an abbreviation.',
        example: `lookupByName('Cupertino', 'CA');
// [{ zip: '95014', city: 'Cupertino', state: 'CA', ... },
//  { zip: '95015', city: 'Cupertino', state: 'CA', ... }]

lookupByName('new york', 'New York').length; // 146`,
    },
    {
        id: 'lookupByState',
        name: 'lookupByState',
        signature: 'lookupByState(state: string): ZipCode[]',
        summary: 'Every ZIP code in a state or territory.',
        example: `lookupByState('RI').length;           // 90
lookupByState('Rhode Island').length; // 90
lookupByState('Narnia');              // []`,
    },
    {
        id: 'lookupByCoords',
        name: 'lookupByCoords',
        signature: 'lookupByCoords(latitude: number, longitude: number): ZipCode | null',
        summary: 'Reverse geocode: find the ZIP code closest to a latitude and longitude.',
        details: 'Returns the ZIP code whose center point is nearest. It does not test ZIP code boundaries.',
        example: `lookupByCoords(36.131, -95.937);
// { zip: '74114', city: 'Tulsa', state: 'OK', ... }`,
    },
    {
        id: 'nearest',
        name: 'nearest',
        signature: 'nearest(latitude: number, longitude: number, limit?: number): NearestResult[]',
        summary: 'The closest ZIP codes to a coordinate, nearest first, with the distance to each.',
        example: `nearest(40.7128, -74.006, 3);
// [{ code: { zip: '10007', city: 'New York', ... }, miles: 0.09 },
//  { code: { zip: '10279', city: 'New York', ... }, miles: 0.09 },
//  { code: { zip: '10004', city: 'New York', ... }, miles: 0.10 }]`,
        since: '9.0.0',
    },
    {
        id: 'search',
        name: 'search',
        signature: 'search(query: string, options?: { limit?: number; state?: string }): CityMatch[]',
        summary: 'Find cities by the start of their name. Built for autocomplete inputs.',
        details: 'Case-insensitive prefix match, sorted by city name. Defaults to 10 results.',
        example: `search('san fr');
// [{ city: 'San Francisco', state: 'CA', zips: ['94102', '94103', ...] }]

search('spring', { state: 'IL', limit: 2 });
// [{ city: 'Spring Grove', state: 'IL', zips: ['60081'] },
//  { city: 'Spring Valley', state: 'IL', zips: ['61362'] }]`,
        since: '9.0.0',
    },
    {
        id: 'random',
        name: 'random',
        signature: 'random(): ZipCode',
        summary: 'A random ZIP code record. Handy for demos, seed data and tests.',
        example: `random();
// { zip: '74114', city: 'Tulsa', state: 'OK', ... }`,
    },
    {
        id: 'units',
        name: 'toKilometers / toMiles / haversine',
        signature:
            'toKilometers(miles: number): number\ntoMiles(kilometers: number): number\nhaversine(lat1: number, lon1: number, lat2: number, lon2: number): number',
        summary: 'Unit conversion (rounded to whole numbers) and raw great-circle distance in miles between two coordinates.',
        example: `toKilometers(1662); // 2675
toMiles(2675);      // 1662

haversine(40.7484, -73.9967, 34.0901, -118.4065); // 2453.2`,
    },
    {
        id: 'data',
        name: 'codes / states',
        signature:
            'codes: Record<string, ZipCode>\nstates.normalize(state: string): string | undefined\nstates.abbr: Record<string, string>\nstates.full: Record<string, string>',
        summary: 'Direct access to the whole dataset and to the state name helpers.',
        example: `Object.keys(codes).length;         // 41203
states.normalize('Rhode Island');  // 'RI'
states.abbr.RI;                    // 'RHODE ISLAND'`,
    },
];

export const zipCodeType = `interface ZipCode {
    zip: string;       // '90210' (always a string, so leading zeros survive)
    latitude: number;  // 34.0901
    longitude: number; // -118.4065
    city: string;      // 'Beverly Hills'
    state: string;     // 'CA'
    country: string;   // 'US'
}`;

export const faq = [
    {
        q: 'How do I look up a US ZIP code in Node.js?',
        a: "Install @bluehive/zipcodes with npm, then call lookup('90210'). It returns an object with the city, state, latitude and longitude, or undefined if the ZIP code doesn't exist. The data ships with the package, so no API key or network request is needed.",
    },
    {
        q: 'How do I calculate the distance between two ZIP codes in JavaScript?',
        a: "Call distance('62959', '90210') from @bluehive/zipcodes. It returns the straight-line (great-circle) distance in whole miles, 1662 in this case. Use toKilometers() to convert. It is not driving distance.",
    },
    {
        q: 'How do I find all ZIP codes within a radius?',
        a: "Call radius('95014', 50) to get every ZIP code within 50 miles of 95014. Pass true as a third argument to get full records with city, state and coordinates instead of just the ZIP code strings.",
    },
    {
        q: 'How do I get the ZIP code for a latitude and longitude?',
        a: 'Call lookupByCoords(latitude, longitude) to get the nearest ZIP code, or nearest(latitude, longitude, 5) to get the five closest with their distances. The match is by distance to each ZIP code center point, not by boundary polygon.',
    },
    {
        q: 'Does it need an API key or an internet connection?',
        a: 'No. The full dataset of 41,203 ZIP codes is bundled in the npm package. Every function is synchronous and runs locally, so it works offline, in CI and in serverless functions with no rate limits.',
    },
    {
        q: 'Does it work with TypeScript, ES modules and CommonJS?',
        a: 'Yes. The package is written in TypeScript and ships its own type definitions. Both import { lookup } from "@bluehive/zipcodes" and require("@bluehive/zipcodes") work, on Node.js 18 or newer.',
    },
    {
        q: 'Can I use it in the browser?',
        a: 'Yes, with any bundler. The playground on this page runs the library in your browser. The dataset is about 1.5 MB (about 520 kB gzipped), so load it with a dynamic import() rather than putting it in your main bundle.',
    },
    {
        q: 'Where does the data come from, and how current is it?',
        a: 'ZIP codes come from the USPS ZIP Locale Detail file, with coordinates from GeoNames and the US Census Bureau geocoder. The data was last refreshed in November 2026, from the USPS release of October 2026. New releases are published to npm when the data is updated.',
    },
    {
        q: 'Which places are covered?',
        a: 'All 50 states and Washington DC, plus Puerto Rico, Guam, the US Virgin Islands, American Samoa, the Northern Mariana Islands, the Marshall Islands, Palau and Micronesia. Military APO/FPO ZIP codes and non-US postal codes are not included.',
    },
    {
        q: 'Is it free for commercial use?',
        a: 'Yes. @bluehive/zipcodes is open source under the BSD-3-Clause license, which allows commercial use.',
    },
    {
        q: 'How is this different from the zipcodes package on npm?',
        a: '@bluehive/zipcodes is a maintained fork of the original zipcodes package by Dav Glass. It keeps the same API, so it is a drop-in replacement, and adds current USPS data, TypeScript types, ES module support, a smaller and faster build, and new functions such as search, nearest and isValid.',
    },
] as const;

export const dataSources = [
    { name: 'USPS ZIP Locale Detail', href: 'https://postalpro.usps.com/ZIP_Locale_Detail', role: 'The list of ZIP codes' },
    { name: 'GeoNames postal codes', href: 'https://download.geonames.org/export/zip/', role: 'Coordinates and city names' },
    { name: 'US Census Bureau Geocoder', href: 'https://geocoding.geo.census.gov/', role: 'Coordinates for ZIP codes GeoNames lacks' },
] as const;
