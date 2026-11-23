/**
 * Compatibility entry for code that deep-imported `lib/codes` in versions before 9.
 * Prefer the main entry point.
 */
import { codes } from './index';

export { codes };

/** State abbreviation mapped to its ZIP codes, in dataset order. */
export const stateMap: Record<string, string[]> = {};

for (const zip of Object.keys(codes)) {
    const state = (codes[zip] as { state: string }).state;
    (stateMap[state] ??= []).push(zip);
}
