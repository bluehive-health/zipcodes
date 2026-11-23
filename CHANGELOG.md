# Changelog

Notable changes to `@bluehive/zipcodes`. Versions follow [semantic versioning](https://semver.org).

## 9.0.0

A TypeScript rewrite. The existing API is unchanged, so most projects can upgrade without code changes.

### Added

- TypeScript source with bundled type definitions (`ZipCode`, `NearestResult`, `CityMatch`, `SearchOptions`).
- ES module support: `import { lookup } from '@bluehive/zipcodes'` works alongside `require()`.
- `isValid(zip)`: whether a ZIP code exists.
- `nearest(latitude, longitude, limit)`: the closest ZIP codes to a coordinate, with distances.
- `search(query, { limit, state })`: city name prefix search for autocomplete.
- `haversine(lat1, lon1, lat2, lon2)`: unrounded great-circle distance in miles.
- `normalizeZip(zip)`: normalize input to a five digit string.
- `lookup` (and everything built on it) accepts ZIP+4 (`'90210-1234'`) and zero-pads numbers (`801`).
- `lookupByState('Puerto Rico')` and `lookupByState('Marshall Islands')` work by full name.
- `llms.txt`, `AGENTS.md`, a documentation site at <https://zipcodes.bluehive.com>, and CI on every pull request.

### Data

- Refreshed from the USPS release of October 2026: 41,203 ZIP codes, up from 41,025. No ZIP codes were removed.
- Puerto Rico is now complete (177 ZIP codes, up from 9). American Samoa (1), the Northern Mariana
  Islands (3), Palau (1) and the Federated States of Micronesia (4) are new, and `lookupByState` accepts
  their names as well as `AS`, `MP`, `PW` and `FM`.
- `data/zipcodes.tsv` is now sorted by ZIP code.

### Changed

- **Requires Node.js 18 or newer.**
- The package is 3x smaller (1.5 MB unpacked, down from 4.9 MB) and loads about 5x faster (about 35 ms,
  down from about 180 ms).
- `radius` is about 30x faster, `lookupByCoords` about 25x faster, and `lookupByName` no longer scans a
  whole state.
- The build output moved from `lib/` to `dist/`. The old deep import paths (`lib/index.js`,
  `lib/states.js`, `lib/codes.js`) still resolve.
- The dataset is now stored as `data/zipcodes.tsv`. The records are unchanged from 8.0.8.
- `license` in `package.json` is now the SPDX identifier `BSD-3-Clause`. The license itself hasn't changed.
- Tests moved from vows and istanbul to Vitest. The data scripts no longer need axios or wget.

### Fixed

- `distance` could return `NaN` for a ZIP code compared with itself (or with another ZIP code at the same
  coordinates), which also made `radius` leave those ZIP codes out. Both now return the right answer.
- `lookup('constructor')` and similar inherited property names returned a function instead of `undefined`.
- `lookupByCoords` returns `null` for non-numeric coordinates instead of an arbitrary record.

### Removed

- Three-character Canadian postal prefix handling in `lookup`. The dataset has had no Canadian codes for
  some time, so this never matched.

## 8.0.8 and earlier

See the [GitHub releases](https://github.com/bluehive-health/zipcodes/releases).
