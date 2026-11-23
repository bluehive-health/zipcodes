#!/bin/bash
# Downloads the upstream sources and rebuilds data/zipcodes.tsv.
#
#   USPS_RELEASE=2025-06 ./scripts/fetch.sh
#
# USPS publishes ZIP_Locale_Detail.xls under a YYYY-MM folder; see
# https://postalpro.usps.com/ZIP_Locale_Detail for the current one.

set -euo pipefail

cd "$(dirname "$0")"

USPS_RELEASE="${USPS_RELEASE:-2025-06}"
GEONAMES_FILES=(US GU VI PR AS MP)

for tool in curl unzip node; do
    if ! command -v "$tool" >/dev/null; then
        echo "Could not find $tool in PATH." >&2
        exit 1
    fi
done

cleanup() {
    rm -f ./ZIP_Locale_Detail.xls
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
curl -fsSL -o ZIP_Locale_Detail.xls \
    "https://postalpro.usps.com/mnt/glusterfs/$USPS_RELEASE/ZIP_Locale_Detail.xls"

echo "Processing"
node ./update-data.mjs
node ./generate-data.mjs

echo "Done. Review the diff of data/zipcodes.tsv, then run: npm test"
