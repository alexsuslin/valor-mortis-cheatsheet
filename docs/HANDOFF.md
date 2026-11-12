# Handoff

Read the [README](../README.md) for setup and [verification notes](verification.md) when changing guide content or browser behavior.

## Current state

- Adoption baseline: commit `81a2a05`.
- The project is a static bilingual Valor Mortis guide with browser-local progress.

## Verification

From the repository root, use the documented checks below.

```sh
npm ci
npm test
npm run check
npm run build
npm run test:browser
```

Build the site before running the browser suite, as documented in the README.

Adoption and the handoff link were checked with doctor and a repeat preview. Project checks are pending.

## Next action

Review the adoption diff and run the relevant project checks when preparing the next change.
