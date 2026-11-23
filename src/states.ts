/** Full state / territory names (upper case) mapped to their USPS abbreviation. */
export const full: Record<string, string> = {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'DISTRICT OF COLUMBIA': 'DC',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'HAWAII': 'HI',
    'GUAM': 'GU',
    'U.S. VIRGIN ISLANDS': 'VI',
    'UNITED STATES VIRGIN ISLANDS': 'VI',
    'VIRGIN ISLANDS': 'VI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGON': 'OR',
    'PENNSYLVANIA': 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY',
    'PUERTO RICO': 'PR',
    'MARSHALL ISLANDS': 'MH',
    'AMERICAN SAMOA': 'AS',
    'NORTHERN MARIANA ISLANDS': 'MP'
};

/**
 * USPS abbreviation mapped to the full (upper case) name.
 * Where several names share an abbreviation (e.g. `VI`), the last one in {@link full} wins.
 */
export const abbr: Record<string, string> = {};

for (const name of Object.keys(full)) {
    abbr[full[name] as string] = name;
}

/**
 * Normalize a state name or abbreviation to its upper case USPS abbreviation.
 *
 * Any two-character input is treated as an abbreviation and returned upper-cased
 * without validation. Anything else is looked up as a full name.
 *
 * @example
 * normalize('Illinois'); // 'IL'
 * normalize('il');       // 'IL'
 * normalize('Narnia');   // undefined
 */
export function normalize(state: string): string | undefined {
    const upper = String(state).trim().toUpperCase();
    if (upper.length === 2) {
        return upper;
    }
    return Object.prototype.hasOwnProperty.call(full, upper) ? full[upper] : undefined;
}
