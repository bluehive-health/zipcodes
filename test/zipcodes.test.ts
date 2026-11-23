import { describe, expect, it } from 'vitest';
import zipcodes, {
    codes,
    distance,
    haversine,
    isValid,
    lookup,
    lookupByCoords,
    lookupByName,
    lookupByState,
    nearest,
    normalizeZip,
    radius,
    random,
    search,
    states,
    toKilometers,
    toMiles,
} from '../src/index';

describe('exports', () => {
    it('exposes functions and objects', () => {
        for (const key of ['lookup', 'lookupByName', 'distance', 'radius', 'toMiles', 'toKilometers'] as const) {
            expect(zipcodes[key]).toBeTypeOf('function');
        }
        expect(codes).toBeTypeOf('object');
        expect(states).toBeTypeOf('object');
        expect(zipcodes.codes).toBe(codes);
    });
});

describe('lookup', () => {
    it.each([
        [62959, 'Marion'],
        [11772, 'Patchogue'],
        [33192, 'Miami'],
        [90210, 'Beverly Hills'],
    ])('finds %i (%s)', (zip, city) => {
        expect(lookup(zip)?.city).toBe(city);
    });

    it('returns the state', () => {
        expect(lookup(33192)?.state).toBe('FL');
    });

    it('finds Guam', () => {
        const guam = lookup(96910);
        expect(guam).toMatchObject({ city: 'Hagatna', state: 'GU', country: 'US' });
        expect(guam?.latitude).toBeTypeOf('number');
        expect(guam?.longitude).toBeTypeOf('number');
        expect(lookupByState('GU')).toHaveLength(21);
        expect(lookupByState('Guam')).toHaveLength(21);
    });

    it('finds the US Virgin Islands', () => {
        const vi = lookup('00801');
        expect(vi).toMatchObject({ city: 'St Thomas', state: 'VI', country: 'US' });
        expect(vi?.latitude).toBeTypeOf('number');
        expect(vi?.longitude).toBeTypeOf('number');
        expect(lookupByState('VI')).toHaveLength(16);
        expect(lookupByState('Virgin Islands')).toHaveLength(16);
    });

    it('accepts strings, numbers, ZIP+4 and padding', () => {
        const hills = lookup('90210');
        expect(lookup(90210)).toBe(hills);
        expect(lookup('90210-1234')).toBe(hills);
        expect(lookup('902101234')).toBe(hills);
        expect(lookup(' 90210 ')).toBe(hills);
        // A numeric literal can't keep its leading zeros, so numbers are padded.
        expect(lookup(801)).toBe(lookup('00801'));
    });

    it('returns undefined for anything that is not a known ZIP', () => {
        expect(lookup('99999')).toBeUndefined();
        expect(lookup(123456)).toBeUndefined();
        expect(lookup('V5N')).toBeUndefined();
        expect(lookup('')).toBeUndefined();
        expect(lookup('constructor')).toBeUndefined();
        expect(lookup('__proto__')).toBeUndefined();
        expect(lookup(90210.5)).toBeUndefined();
        expect(lookup(null as never)).toBeUndefined();
        expect(lookup(undefined as never)).toBeUndefined();
    });
});

describe('normalizeZip / isValid', () => {
    it('normalizes shapes', () => {
        expect(normalizeZip(801)).toBe('00801');
        expect(normalizeZip('90210-1234')).toBe('90210');
        expect(normalizeZip('9021')).toBeUndefined();
        expect(normalizeZip(-1)).toBeUndefined();
        expect(normalizeZip(null)).toBeUndefined();
    });

    it('checks existence', () => {
        expect(isValid('90210')).toBe(true);
        expect(isValid(90210)).toBe(true);
        expect(isValid('00000')).toBe(false);
        expect(isValid('nope')).toBe(false);
    });
});

describe('distance', () => {
    it('finds distances', () => {
        expect(distance(62959, 90210)).toBe(1662);
        expect(distance(62959, 62959)).toBe(0);
        expect(distance(62959, 63801)).toBe(68);

        const d = distance(62959, 95014);
        expect(d).toBe(1805);
        expect(toKilometers(d as number)).toBe(2905);
        expect(toMiles(toKilometers(d as number))).toBe(d);
    });

    it('returns null for unknown ZIP codes', () => {
        expect(distance(62959, 123456)).toBeNull();
        expect(distance(123456, 62959)).toBeNull();
        expect(distance(123456, 'V5N')).toBeNull();
    });

    it('is 0 (never NaN) from every ZIP code to itself', () => {
        for (const zip of Object.keys(codes)) {
            expect(distance(zip, zip)).toBe(0);
        }
    });

    it('exposes haversine for raw coordinates', () => {
        expect(haversine(40.7484, -73.9967, 40.7484, -73.9967)).toBe(0);
        expect(Math.round(haversine(40.7484, -73.9967, 34.0901, -118.4065))).toBe(2453);
    });
});

describe('lookupByName', () => {
    it('finds by city and state', () => {
        expect(lookupByName('Marion', 'il')).toHaveLength(1);
        expect(lookupByName('Marion', 'Illinois')).toHaveLength(1);
        expect(lookupByName('Cupertino', 'CA')).toHaveLength(2);
        expect(lookupByName('New York', 'New York')).toHaveLength(146);
        expect(lookupByName('New York', 'NY')).toHaveLength(146);
    });

    it('is case-insensitive and returns [] when nothing matches', () => {
        expect(lookupByName('cupertino', 'ca')).toEqual(lookupByName('Cupertino', 'CA'));
        expect(lookupByName('Nowhereville', 'CA')).toEqual([]);
        expect(lookupByName('Cupertino', 'foobar')).toEqual([]);
    });

    it('returns a fresh array each call', () => {
        const first = lookupByName('Cupertino', 'CA');
        first.length = 0;
        expect(lookupByName('Cupertino', 'CA')).toHaveLength(2);
    });
});

describe('lookupByState', () => {
    it('finds by abbreviation or name', () => {
        expect(lookupByState('RI')).toHaveLength(90);
        expect(lookupByState('ri')).toHaveLength(90);
        expect(lookupByState('Rhode Island')).toHaveLength(90);
        expect(lookupByState('foobar')).toHaveLength(0);
    });

    it('knows Puerto Rico by name', () => {
        expect(lookupByState('Puerto Rico').length).toBeGreaterThan(0);
        expect(lookupByState('Puerto Rico')).toEqual(lookupByState('PR'));
    });

    it('covers every record exactly once', () => {
        const all = new Set(Object.values(codes).map((c) => c.state));
        let total = 0;
        for (const state of all) {
            total += lookupByState(state).length;
        }
        expect(total).toBe(Object.keys(codes).length);
    });
});

describe('lookupByCoords / nearest', () => {
    it('finds the closest ZIP code', () => {
        expect(lookupByCoords(29.2108, -81.0228)?.city).toBe('Daytona Beach');
        expect(lookupByCoords(40.715, -73.985)?.city).toBe('New York');
        expect(lookupByCoords(36.131, -95.937)?.city).toBe('Tulsa');
    });

    it('returns null for bad coordinates', () => {
        expect(lookupByCoords(NaN, 0)).toBeNull();
        expect(lookupByCoords(undefined as never, undefined as never)).toBeNull();
    });

    it('returns the nearest N sorted by distance', () => {
        const results = nearest(40.715, -73.985, 5);
        expect(results).toHaveLength(5);
        expect(results[0]?.code).toBe(lookupByCoords(40.715, -73.985));
        for (let i = 1; i < results.length; i++) {
            expect(results[i]!.miles).toBeGreaterThanOrEqual(results[i - 1]!.miles);
        }
        expect(nearest(40.715, -73.985, 0)).toEqual([]);
    });
});

describe('radius', () => {
    it('finds ZIP codes in range', () => {
        expect(radius(null as never, 20)).toHaveLength(0);
        expect(radius(62959, 20)).toHaveLength(37);
        expect(radius(95014, 50)).toHaveLength(371);

        const full = radius(95014, 50, true);
        expect(full).toHaveLength(371);
        expect(full[0]).toEqual({
            zip: '93901',
            latitude: 36.6677,
            longitude: -121.6596,
            city: 'Salinas',
            state: 'CA',
            country: 'US',
        });
    });

    it('agrees with distance()', () => {
        const expected = Object.keys(codes).filter((zip) => (distance(10001, zip) as number) <= 25);
        expect(radius(10001, 25)).toEqual(expected);
    });

    it('includes the center ZIP code', () => {
        expect(radius(62959, 0)).toContain('62959');
    });
});

describe('search', () => {
    it('finds cities by prefix', () => {
        const [first] = search('san fr');
        expect(first).toMatchObject({ city: 'San Francisco', state: 'CA' });
        expect(first?.zips).toContain('94102');
    });

    it('honours limit and state', () => {
        expect(search('spring', { limit: 3 })).toHaveLength(3);
        const il = search('spring', { state: 'Illinois', limit: 50 });
        expect(il.length).toBeGreaterThan(0);
        expect(il.every((m) => m.state === 'IL')).toBe(true);
        expect(search('spring', { state: 'foobar' })).toEqual([]);
        expect(search('')).toEqual([]);
        expect(search('zzzzzz')).toEqual([]);
    });
});

describe('random', () => {
    it('returns different records', () => {
        const seen = new Set();
        for (let i = 0; i < 10; i++) {
            const pick = random();
            expect(pick).toBeTypeOf('object');
            expect(codes[pick.zip]).toBe(pick);
            seen.add(pick);
        }
        expect(seen.size).toBeGreaterThan(1);
    });
});

describe('states', () => {
    it('normalizes names and abbreviations', () => {
        expect(states.normalize('Illinois')).toBe('IL');
        expect(states.normalize('il')).toBe('IL');
        expect(states.normalize('Narnia')).toBeUndefined();
        expect(states.normalize('toString')).toBeUndefined();
        expect(states.abbr.CA).toBe('CALIFORNIA');
        expect(states.full.CALIFORNIA).toBe('CA');
    });
});

describe('dataset', () => {
    it('is well formed', () => {
        const keys = Object.keys(codes);
        expect(keys.length).toBeGreaterThan(40000);
        for (const zip of keys) {
            const c = codes[zip]!;
            expect(c.zip).toBe(zip);
            expect(zip).toMatch(/^\d{5}$/);
            expect(c.state).toMatch(/^[A-Z]{2}$/);
            expect(c.country).toBe('US');
            expect(Number.isFinite(c.latitude) && Number.isFinite(c.longitude)).toBe(true);
            expect(c.city.length).toBeGreaterThan(0);
        }
    });
});
