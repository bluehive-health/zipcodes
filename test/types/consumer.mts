// Type-checked (never run) by test/package.test.ts as a Node16/NodeNext ESM consumer
// of the built package. It pins the ESM typings to what dist/index.mjs really exports.
import zipcodes, { lookup, search, type ZipCode } from '@bluehive-health/zipcodes';

const record: ZipCode | undefined = lookup('90210');
const viaDefault: ZipCode | undefined = zipcodes.lookup('90210');
const cities: string[] = search('san', null).map((match) => match.city);

// The default export is the API object itself, not a module namespace wrapping it.
// @ts-expect-error `zipcodes.default` is undefined at runtime
zipcodes.default;

export { record, viaDefault, cities };
