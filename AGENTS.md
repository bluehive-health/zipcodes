# Working on this repository

Guidance for AI coding agents (and people) changing this repo. If you only want to *use* the package, read
[`llms.txt`](llms.txt) or the [README](README.md) instead.

## What this is

`@bluehive/zipcodes` is an offline US ZIP code lookup library. It has no runtime dependencies. The whole
public API is in `src/index.ts`.

## Layout

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Every public function and type |
| `src/states.ts` | State names and abbreviations |
| `src/codes.ts` | Compatibility shim for the old `lib/codes` deep import. Don't add to it. |
| `src/data.generated.ts` | Generated, gitignored. Never edit or commit it. |
| `data/zipcodes.tsv` | The dataset. The source of truth. |
| `scripts/` | Data generation, the upstream data refresh, the ESM wrapper, benchmarks |
| `test/` | Vitest tests. `package.test.ts` checks the built package; the rest test `src/` |
| `website/` | Docs site (its own `package.json`): React 19, Tailwind CSS 4, `@mieweb/ui` with the BlueHive brand |
| `llms.txt` | Summary for language models. Ships in the npm package and on the website. |

## Commands

```bash
npm install
npm test               # generate data, build, run all tests. Run this before you finish.
npm run typecheck
npm run bench          # check performance after touching a hot path
npm run website:build  # build the docs site (installs website dependencies first)
```

## Rules

- **Stay backward compatible.** Existing function names, argument orders, return shapes and result ordering
  are relied on by users. Add; don't change. A breaking change needs a major version and a note in the README's
  upgrade section.
- **No runtime dependencies.** `dependencies` in `package.json` stays empty.
- **Never throw on bad input.** Lookups return `undefined`, `null` or `[]` as documented.
- **Don't hand-edit the dataset** to fix one record without saying so in the PR; a data refresh
  (`npm run data:update`) will keep it only if upstream agrees. Never edit `src/data.generated.ts`.
- **Keep the docs in step.** A change to the public API needs matching updates in: the JSDoc in
  `src/index.ts`, `README.md`, `llms.txt`, `website/src/content.ts` and `CHANGELOG.md`. Example output in
  docs must be real output: run the code and paste what it prints.
- **Tests assert exact counts** from the current dataset (for example 371 ZIP codes within 50 miles of
  95014). After a data refresh, verify the new numbers are plausible, then update the tests and the docs.
- **The version in `package.json` is not the release version.** The release tag decides it; see
  "Releasing" in the README. Don't bump it by hand.
- `package-lock.json` in the repo root is intentionally not committed. `website/package-lock.json` is.

## Website

- Use components from `@mieweb/ui` before writing markup, and follow the rules in
  `website/node_modules/@mieweb/ui/agent/mieweb-ui.instructions.md`. Use design tokens
  (`bg-primary-600`, `text-muted-foreground`), never hard-coded colours.
- All copy lives in `website/src/content.ts`. The page, its JSON-LD structured data and `llms-full.txt` are
  generated from it and from the README by `website/scripts/prerender.mjs`.
- The site is prerendered to static HTML so crawlers and AI agents can read it without running
  JavaScript. Keep every component server-renderable: no `window` or `document` access during render.
- The playground imports the library source through a Vite alias, so it always runs the code in this commit.
