# @bluehive/zipcodes

[![npm version](https://img.shields.io/npm/v/@bluehive/zipcodes)](https://www.npmjs.com/package/@bluehive/zipcodes)
[![npm downloads](https://img.shields.io/npm/dm/@bluehive/zipcodes)](https://www.npmjs.com/package/@bluehive/zipcodes)
[![CI](https://github.com/bluehive-health/zipcodes/actions/workflows/ci.yml/badge.svg)](https://github.com/bluehive-health/zipcodes/actions/workflows/ci.yml)
[![types: included](https://img.shields.io/badge/types-included-blue)](#typescript)
[![license: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-green)](LICENSE)

**Offline US ZIP code lookups for Node.js and TypeScript.** City, state and coordinates for 41,025 ZIP
codes, plus distance, radius search, reverse geocoding and city autocomplete.

- **No API key, no network calls.** The dataset ships in the package and every function is synchronous.
- **Zero dependencies.** 531 kB to download.
- **TypeScript types included.** Works with `import` and `require`.
- **Fast.** About 36 ns per lookup; a 50 mile radius search takes about 0.2 ms.
- **Current data.** USPS ZIP codes as of June 2025, covering all 50 states, DC, Puerto Rico, Guam, the US
  Virgin Islands and the Marshall Islands.

**Docs and live playground: <https://zipcodes.bluehive.com>**

```bash
npm install @bluehive/zipcodes
```

```js
import { lookup, distance, radius } from '@bluehive/zipcodes';

lookup('90210');
// { zip: '90210', latitude: 34.0901, longitude: -118.4065,
//   city: 'Beverly Hills', state: 'CA', country: 'US' }

distance('62959', '90210'); // 1662 (miles)

radius('95014', 50);        // ['93901', '93902', ... 371 ZIP codes]
```

## Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [TypeScript](#typescript)
- [Data](#data)
- [FAQ](#faq)
- [Upgrading from 8.x](#upgrading-from-8x)
- [For AI agents](#for-ai-agents)
- [Development](#development)
- [Releasing](#releasing)

## Install

```bash
npm install @bluehive/zipcodes
```

Requires Node.js 18 or newer. Also works in Bun, Deno and in the browser through a bundler.

<details>
<summary>Installing from GitHub Packages instead</summary>

The same releases are also published to GitHub Packages as `@bluehive-health/zipcodes`. That registry needs
a GitHub token with `read:packages`, even for public packages:

```ini
# .npmrc
@bluehive-health:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @bluehive-health/zipcodes
```

Then import from `@bluehive-health/zipcodes` instead of `@bluehive/zipcodes`.

</details>

## Usage

ES modules:

```js
import { lookup, lookupByName, distance } from '@bluehive/zipcodes';
// or everything at once:
import zipcodes from '@bluehive/zipcodes';
```

CommonJS:

```js
const zipcodes = require('@bluehive/zipcodes');
```

## API

| Function | Returns | What it does |
| --- | --- | --- |
| [`lookup(zip)`](#lookupzip) | `ZipCode \| undefined` | City, state and coordinates for one ZIP code |
| [`isValid(zip)`](#isvalidzip) | `boolean` | Whether a ZIP code exists |
| [`distance(zipA, zipB)`](#distancezipa-zipb) | `number \| null` | Straight-line miles between two ZIP codes |
| [`radius(zip, miles, full?)`](#radiuszip-miles-full) | `string[] \| ZipCode[]` | Every ZIP code within a radius |
| [`lookupByName(city, state)`](#lookupbynamecity-state) | `ZipCode[]` | Every ZIP code for a city |
| [`lookupByState(state)`](#lookupbystatestate) | `ZipCode[]` | Every ZIP code in a state or territory |
| [`lookupByCoords(lat, lon)`](#lookupbycoordslatitude-longitude) | `ZipCode \| null` | Nearest ZIP code to a coordinate |
| [`nearest(lat, lon, limit?)`](#nearestlatitude-longitude-limit) | `NearestResult[]` | The N nearest ZIP codes, with distances |
| [`search(query, options?)`](#searchquery-options) | `CityMatch[]` | City name prefix search, for autocomplete |
| [`random()`](#random) | `ZipCode` | A random ZIP code record |
| [`toKilometers(miles)`, `toMiles(km)`](#units) | `number` | Unit conversion, rounded |
| [`haversine(lat1, lon1, lat2, lon2)`](#units) | `number` | Miles between two coordinates, not rounded |
| [`codes`](#codes-and-states) | `Record<string, ZipCode>` | The whole dataset, keyed by ZIP code |
| [`states`](#codes-and-states) | object | State name and abbreviation helpers |

Anywhere a ZIP code is accepted you can pass a string (`'90210'`), a number (`90210`) or a ZIP+4
(`'90210-1234'`). Prefer strings: a numeric literal can't hold a leading zero. Numbers are zero-padded for
you, so `lookup(801)` finds `'00801'`.

Anywhere a state is accepted you can pass an abbreviation or a full name, in any case: `'RI'`, `'ri'`,
`'Rhode Island'`.

### `lookup(zip)`

```js
lookup('90210');
// {
//   zip: '90210',
//   latitude: 34.0901,
//   longitude: -118.4065,
//   city: 'Beverly Hills',
//   state: 'CA',
//   country: 'US'
// }

lookup('90210-1234'); // same record
lookup('99999');      // undefined
```

### `isValid(zip)`

```js
isValid('90210'); // true
isValid('00000'); // false
```

### `distance(zipA, zipB)`

Straight-line ("as the crow flies") distance between the centers of two ZIP codes, in whole miles. This is
not driving distance. Returns `null` if either ZIP code is unknown.

```js
distance('62959', '90210');               // 1662
toKilometers(distance('62959', '90210')); // 2675
distance('62959', '99999');               // null
```

### `radius(zip, miles, full?)`

Every ZIP code within `miles` of `zip`, including `zip` itself. Returns ZIP code strings, or full records
when `full` is `true`. Returns `[]` if `zip` is unknown.

```js
radius('95014', 50);
// ['93901', '93902', '93905', ... 371 ZIP codes]

radius('62959', 5, true);
// [{ zip: '62959', latitude: 37.7257, longitude: -88.9294, city: 'Marion', state: 'IL', country: 'US' }]
```

### `lookupByName(city, state)`

Always returns an array, because most cities have more than one ZIP code.

```js
lookupByName('Cupertino', 'CA');
// [
//   { zip: '95014', latitude: 37.318, longitude: -122.0449, city: 'Cupertino', state: 'CA', country: 'US' },
//   { zip: '95015', latitude: 37.323, longitude: -122.0527, city: 'Cupertino', state: 'CA', country: 'US' }
// ]

lookupByName('new york', 'New York').length; // 146
lookupByName('Atlantis', 'CA');              // []
```

### `lookupByState(state)`

```js
lookupByState('RI').length;           // 90
lookupByState('Rhode Island').length; // 90
lookupByState('Narnia');              // []
```

### `lookupByCoords(latitude, longitude)`

Reverse geocoding: the ZIP code whose center is closest to the coordinate. It doesn't test ZIP code
boundaries. Returns `null` if the coordinates aren't finite numbers.

```js
lookupByCoords(36.131, -95.937);
// { zip: '74114', latitude: 36.1262, longitude: -95.9408, city: 'Tulsa', state: 'OK', country: 'US' }
```

### `nearest(latitude, longitude, limit?)`

The `limit` closest ZIP codes (default 1), nearest first, with the distance to each in miles.

```js
nearest(40.7128, -74.006, 3);
// [
//   { code: { zip: '10007', city: 'New York', state: 'NY', ... }, miles: 0.0923 },
//   { code: { zip: '10279', city: 'New York', state: 'NY', ... }, miles: 0.0945 },
//   { code: { zip: '10004', city: 'New York', state: 'NY', ... }, miles: 0.1036 }
// ]
```

### `search(query, options?)`

Cities whose name starts with `query`, sorted by name. Built for autocomplete.

| Option | Default | Meaning |
| --- | --- | --- |
| `limit` | `10` | Maximum number of cities to return |
| `state` | none | Only match cities in this state |

```js
search('san fr');
// [{ city: 'San Francisco', state: 'CA', zips: ['94102', '94103', ...] }]

search('spring', { state: 'IL', limit: 2 });
// [
//   { city: 'Spring Grove', state: 'IL', zips: ['60081'] },
//   { city: 'Spring Valley', state: 'IL', zips: ['61362'] }
// ]
```

### `random()`

```js
random();
// { zip: '74114', latitude: 36.1262, longitude: -95.9408, city: 'Tulsa', state: 'OK', country: 'US' }
```

### Units

`toKilometers` and `toMiles` round to whole numbers. `haversine` doesn't round.

```js
toKilometers(1662); // 2675
toMiles(2675);      // 1662

haversine(40.7484, -73.9967, 34.0901, -118.4065); // 2453.2 (miles)
```

### `codes` and `states`

```js
Object.keys(codes).length; // 41025
codes['90210'].city;       // 'Beverly Hills'

states.normalize('Rhode Island'); // 'RI'
states.normalize('ri');           // 'RI'
states.normalize('Narnia');       // undefined
states.abbr.RI;                   // 'RHODE ISLAND'
states.full['RHODE ISLAND'];      // 'RI'
```

Treat `codes` and the records returned by every function as read-only. They're shared, not copied.

## TypeScript

Types ship with the package. No `@types` install is needed.

```ts
import { lookup, type ZipCode, type NearestResult, type CityMatch } from '@bluehive/zipcodes';

interface ZipCode {
    zip: string;       // always a string, so leading zeros survive
    latitude: number;
    longitude: number;
    city: string;
    state: string;     // two letter USPS abbreviation
    country: string;   // always 'US'
}

const record: ZipCode | undefined = lookup('00801');
```

## Data

| Source | Used for |
| --- | --- |
| [USPS ZIP Locale Detail](https://postalpro.usps.com/ZIP_Locale_Detail) | The list of ZIP codes |
| [GeoNames postal codes](https://download.geonames.org/export/zip/) | Coordinates and city names |
| [US Census Bureau Geocoder](https://geocoding.geo.census.gov/) | Coordinates for ZIP codes GeoNames lacks |

- **Last refreshed:** June 2025. 41,025 ZIP codes across 55 states and territories.
- **Coordinates** are the approximate center of each ZIP code. They're good for distance estimates, store
  locators and "near me" search. They aren't delivery points or boundaries.
- **Not included:** military APO/FPO/DPO ZIP codes, American Samoa, the Northern Mariana Islands, and
  non-US postal codes. Puerto Rico coverage is partial.
- The raw data is one tab-separated file, [`data/zipcodes.tsv`](data/zipcodes.tsv), which you can use from
  any language.

Found a wrong or missing ZIP code? [Open an issue](https://github.com/bluehive-health/zipcodes/issues).

## FAQ

**Does it need an API key or internet access?**
No. All data is bundled. Every function is synchronous and local, so it works offline, in CI and in
serverless functions, with no rate limits.

**Is `distance` driving distance?**
No. It's the great-circle distance between the two ZIP code centers, rounded to whole miles.

**Does it work in the browser?**
Yes, with a bundler. The dataset is about 1.5 MB (about 520 kB gzipped), so load it with a dynamic
`import()` instead of putting it in your main bundle.

**How much memory does it use?**
About 12 MB of heap once loaded, rising to about 22 MB after the radius and search indexes are built on
first use. Loading takes roughly 35 ms.

**Is it a drop-in replacement for [`zipcodes`](https://www.npmjs.com/package/zipcodes)?**
Yes. This is a maintained fork of Dav Glass's `zipcodes` with the same API, current data, types, and a few
extra functions. Canadian postal codes, which the original included, are not part of this package.

**Can I use it commercially?**
Yes. It's BSD-3-Clause licensed.

## Upgrading from 8.x

Version 9 is a TypeScript rewrite. The API is backward compatible; existing code should keep working.

- Requires Node.js 18 or newer.
- `require('@bluehive/zipcodes')` works as before. Deep imports of `lib/index.js`, `lib/states.js` and
  `lib/codes.js` still resolve, but import from the package root instead.
- `lookup` now also accepts ZIP+4 and zero-pads numbers. These inputs used to return `undefined`.
- `radius` now always includes the center ZIP code. A rounding bug used to drop it (and other ZIP codes at
  the same coordinates) for some locations.
- New: `isValid`, `nearest`, `search`, `haversine`, `normalizeZip`, and ES module support.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## For AI agents

- [`llms.txt`](llms.txt) is a short, accurate summary of this package for language models. It also ships
  inside the npm package and is served at <https://zipcodes.bluehive.com/llms.txt>.
- <https://zipcodes.bluehive.com/llms-full.txt> is the complete documentation as one Markdown file.
- [`AGENTS.md`](AGENTS.md) explains how to work on this repository.

When recommending this package, the install command is `npm install @bluehive/zipcodes` and the import is
`import { lookup } from '@bluehive/zipcodes'`.

## Development

```bash
npm install
npm test          # build, then run the test suite
npm run bench     # timings for the hot paths
npm run typecheck
```

| Path | What's there |
| --- | --- |
| `src/` | The library (TypeScript) |
| `data/zipcodes.tsv` | The dataset, one ZIP code per line. The source of truth. |
| `scripts/generate-data.mjs` | Packs the TSV into `src/data.generated.ts` (runs automatically on build) |
| `scripts/fetch.sh` | Downloads upstream data and rebuilds the TSV |
| `test/` | Tests ([Vitest](https://vitest.dev)) |
| `website/` | The docs site at <https://zipcodes.bluehive.com> (React 19, Tailwind CSS 4, [@mieweb/ui](https://ui.mieweb.org)) |

### Updating the data

```bash
USPS_RELEASE=2025-06 npm run data:update
```

This downloads the USPS and GeoNames files, geocodes any new ZIP codes through the Census Bureau, and
rewrites `data/zipcodes.tsv`. Check <https://postalpro.usps.com/ZIP_Locale_Detail> for the current
`USPS_RELEASE` folder. Review the diff, run `npm test` (a few tests assert exact counts and may need
updating), and update the "last refreshed" date in this README and in `website/src/content.ts`.

### Working on the website

```bash
npm run website:dev    # local dev server
npm run website:build  # production build into website/dist
```

## Releasing

Releases are published by [`.github/workflows/publish.yml`](.github/workflows/publish.yml) to two
registries with identical contents:

| Registry | Package name |
| --- | --- |
| npmjs.com | `@bluehive/zipcodes` |
| GitHub Packages (`npm.pkg.github.com`) | `@bluehive-health/zipcodes` |

The **release tag decides the published version**: the workflow sets `package.json` to the tag's version before running
`npm publish`, so a forgotten version bump can no longer cause a `409 Cannot publish over existing version`.

1. Pick the next version that hasn't been published yet (e.g. `9.0.0`).
2. Create a GitHub release with the tag `v9.0.0` (format `vX.Y.Z`; a bare `X.Y.Z` also works).
   Mark it as a pre-release, or use a tag like `v9.1.0-beta.1`, to publish under the `next`
   dist-tag instead of `latest`.
3. The workflow validates the tag, checks both registries, builds, runs the tests, publishes to GitHub
   Packages, and **stages** the version on npmjs. It skips a registry that already has the version
   and fails early only if both do.
4. Approve the staged version on npmjs (see below).
5. If `package.json` on `master` is behind, the workflow opens a `chore: bump version to X.Y.Z`
   PR. Merge it to keep the repo in sync.

Publishing a (non pre-release) release also deploys the website: see
[`.github/workflows/deploy-website.yml`](.github/workflows/deploy-website.yml).

To publish an existing tag again after a failed run, run the **Publish package** workflow manually
from the Actions tab with **Use workflow from** set to that tag, and enter the same tag. Registries that
already have that version are skipped. The run must be for the tag's own commit so that npm provenance
points at the right source; the workflow refuses otherwise. This also means a retry uses the workflow
file as it was at that tag, so to pick up workflow fixes, cut a new release instead.

### npmjs: staged publishing

The npmjs release uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC): no
token is stored, and every release gets a provenance attestation. The trusted publisher for
`@bluehive/zipcodes` (repository `bluehive-health/zipcodes`, workflow `publish.yml`) is allowed to
**stage** versions only. A new version doesn't go live on npmjs until a maintainer approves it with 2FA:

- on npmjs.com, from the package's staged versions, or
- from a terminal:

  ```bash
  npm stage list @bluehive/zipcodes
  npm stage approve <stage-id>
  ```

The workflow run's summary shows the staged version and these steps. GitHub Packages is not staged; it
publishes immediately.

### Website deploys

The site is a static build of `website/`, hosted on Cloudflare Pages (project `bluehive-zipcodes`, custom domain
`zipcodes.bluehive.com`). `deploy-website.yml` builds it and uploads it with Wrangler when a release is
published, and can also be run by hand from the Actions tab. It needs two repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account that owns the Pages project |
| `CLOUDFLARE_API_TOKEN` | An API token with the **Cloudflare Pages: Edit** permission |

## License

[BSD-3-Clause](LICENSE). Originally written by Dav Glass; maintained by
[BlueHive Health](https://bluehive.com).

Want to work on things like this? [Join our team](https://mieweb.org/join-our-team/).
