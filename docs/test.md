# Testing

## Setup

```bash
npm test          # run once
npm run test:watch  # re-run on file changes
```

Vitest with `environment: node`. Tests live in `src/__tests__/`.

## What we test

Pure functions only — no mocking of Airtable, no React component rendering.

### `src/utils.js`

All testable logic extracted here and covered in `src/__tests__/utils.test.js`.

| Function | What's tested |
|---|---|
| `fmtMinutes` | whole hours, hours+minutes, sub-hour, null, empty string |
| `fmtBattery` | positive, zero, negative, null, empty string |
| `calcBaseline` | excludes nights[0], excludes tactic nights, sampleSize cap, rounding, missing fields, independent per-metric averaging, correct count |
| `filterExcluded` | removes `Excluded: true` nights, keeps nights with no field, empty result |
| `buildBaselineInput` | passthrough when lastNight not excluded, prepend when excluded, excluded-lastNight baseline correctness |

## What we don't test

- **Airtable API calls** — `fetchNights` / `saveNight` hit a live API; no value in mocking them at this scale.
- **React components** — UI behavior is verified by running the app.
- **`fmtDate` / `fmtDateShort`** — output depends on the locale of the runtime; not worth asserting a string that varies by environment.

## Checklist for new code

- [ ] New pure function? Add it to `src/utils.js` and write tests for it.
- [ ] New baseline/filtering logic? Add cases to the `calcBaseline` suite.
- [ ] Test the *output value*, not just that the function runs without throwing.
