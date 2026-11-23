# USA Zip Code Lookups (Data Last Updated June 3rd, 2025)

https://www.npmjs.com/package/@bluehive/zipcodes

A localized (flatfile) zipcode lookup (USA Only)

USA zip codes from: https://postalpro.usps.com/ZIP_Locale_Detail

Transformed into a JSON object and then wrapped with some helper methods.

## Usage

```
const zipcodes = require('zipcodes');
```

### Zipcode Lookup

```
const hills = zipcodes.lookup(90210);

{
  zip: '90210',
  latitude: 34.088808,
  longitude: -118.406125,
  city: 'Beverly Hills',
  state: 'CA',
  country: 'US'
}
```

### Distance

This is not driving distance, it's line of sight distance

```
var dist = zipcodes.distance(62959, 90210); //In Miles
// dist = 1662

var kilo = zipcodes.toKilometers(dist); //Convert to Kilometers
// kilo = 2675

var miles = zipcodes.toMiles(zipcodes.toKilometers(dist)); //Convert to Kilometers, then to miles
// miles = 1662
```

### Lookup By Name

```
var l = zipcodes.lookupByName('Cupertino', 'CA');

//Always returns an array, since cities can have multiple zip codes
[
  {
    zip: '95015',
    latitude: 37.323,
    longitude: -122.0527,
    city: 'Cupertino',
    state: 'CA',
    country: 'US'
  }
]
```

### Lookup by Radius

Get all zipcodes within the milage radius of this zipcode

```
var rad = zipcodes.radius(95014, 50);
// rad.length == 385

[ '93901',
  '93902',
  '93905',
  '93906',
  '93907',
  '93912',
  '93933',
  '93942',
  '93944',
  '93950',
  ...
  '95377',
  '95378',
  '95385',
  '95387',
  '95391' 
]
```

### Zipcode Random

```
var zipObj = zipcodes.random();

{ 
  zip: '90210',
  latitude: 34.088808,
  longitude: -118.406125,
  city: 'Beverly Hills',
  state: 'CA',
  country: 'US'
}
```

## TODO

Add support for importing into MongoDB or CouchDB to speed up searchs.

## Development

The original CSV file that I am using for this data is not included in this repo, but I did wrap up
the best way to get the data and how to convert it into the format that this module uses.

To develop with this module, just `make` it and it will fetch the latest zipcodes and reprocess them.

```
make
```

To just fetch and process the zipcodes:

```
make codes
```

To run the very simple test suite:

```
make tests
```

## Releasing

Releases are published to the GitHub Package Registry (`npm.pkg.github.com`) by
[`.github/workflows/publish.yml`](.github/workflows/publish.yml). The **release tag decides the
published version**: the workflow sets `package.json` to the tag's version before running
`npm publish`, so a forgotten version bump can no longer cause a `409 Cannot publish over existing version`.

1. Pick the next version that hasn't been published yet (e.g. `8.0.7`).
2. Create a GitHub release with the tag `v8.0.7` (format `vX.Y.Z`; a bare `X.Y.Z` also works).
   Mark it as a pre-release, or use a tag like `v9.0.0-beta.1`, to publish under the `next`
   dist-tag instead of `latest`.
3. The workflow validates the tag, fails early if that version already exists in the registry,
   runs the tests, and publishes.
4. If `package.json` on `master` is behind, the workflow opens a `chore: bump version to X.Y.Z`
   PR. Merge it to keep the repo in sync.

To publish an existing tag again after a failed run (for example, after fixing the workflow), run the
**Publish to GitHub Package Registry** workflow manually from the Actions tab and enter the tag.
