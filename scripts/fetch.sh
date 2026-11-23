#!/bin/bash
# Downloads the upstream sources and rebuilds data/zipcodes.tsv.
#
#   USPS_RELEASE=2026-10 ./scripts/fetch.sh
#
# USPS publishes Zip_Locale_Detail.xlsx (ZIP_Locale_Detail.xls before 2026)
# under a YYYY-MM folder; see https://postalpro.usps.com/ZIP_Locale_Detail for
# the current one.

set -euo pipefail

cd "$(dirname "$0")"

USPS_RELEASE="${USPS_RELEASE:-2026-10}"
USPS_BASE="https://postalpro.usps.com/mnt/glusterfs/$USPS_RELEASE"
GEONAMES_FILES=(US GU VI PR AS MP PW FM)

for tool in curl unzip node; do
    if ! command -v "$tool" >/dev/null; then
        echo "Could not find $tool in PATH." >&2
        exit 1
    fi
done

cleanup() {
    rm -f ./ZIP_Locale_Detail.xls ./ZIP_Locale_Detail.xlsx
    for country in "${GEONAMES_FILES[@]}"; do
        rm -f "./$country.zip" "./$country.txt"
    done
}
trap cleanup EXIT

for country in "${GEONAMES_FILES[@]}"; do
    echo "Fetching $country ZIP codes from GeoNames"
    curl -fsSL -o "$country.zip" "https://download.geonames.org/export/zip/$country.zip"
    unzip -oq "$country.zip" "$country.txt"
done

echo "Fetching USPS ZIP_Locale_Detail ($USPS_RELEASE)"
if ! curl -fsSL -o ZIP_Locale_Detail.xlsx "$USPS_BASE/Zip_Locale_Detail.xlsx"; then
    # A failed download can leave a partial file, which update-data.mjs would
    # pick over the .xls fallback.
    rm -f ZIP_Locale_Detail.xlsx
    curl -fsSL -o ZIP_Locale_Detail.xls "$USPS_BASE/ZIP_Locale_Detail.xls"
fi

echo "Processing"
node ./update-data.mjs
node ./generate-data.mjs

echo "Done. Review the diff of data/zipcodes.tsv, then run: npm test"
