# Spec 0.2.3 — Confounders & experiment exclusion

> **Status: draft — needs owner review before implementation.**

## Goal

Let the user flag a night as **exceptional** — something unusual happened that would distort tactic analysis. Flagged nights are excluded from tactic effect calculations so the data stays clean.

---

## Behaviour

### Logging confounders

On the Log screen, below the Tactics section, add:

1. **Exceptional circumstances** — multi-select from a predefined list (same UX as tactics picker). User can pick multiple. (Note: "confounders" is the research term but needs a more user-friendly label — TBD e.g. "unusual circumstances", "exceptions", "what else happened".)
2. **Exclude from experiments** — behavior depends on whether confounders are selected:
   - **No confounders selected**: shown as a checkbox the user can toggle manually (for nights they want to exclude without a specific reason).
   - **Any confounder selected**: The checkbox is hidden (exclusion is implicit). At save time, `effectiveExcluded = confounders.length > 0 || excluded` ensures the record is marked excluded. Deselecting all confounders shows the checkbox again, always unchecked — any prior manual exclusion is not preserved. To re-exclude, the user checks the box again.

**Predefined confounders** (stored in `src/confounders.js`):

- Late caffeine (after 2pm)
- Alcohol
- Illness
- Travel / different bed
- Late bedtime (>1h past normal)
- Early alarm
- Noise disruption
- High stress
- Intense late exercise
- Napped during the day
- Other

### Effect on analysis (Home screen)

Build `analysisNights = nights.filter(n => !n.Excluded)` once at the top of the Home render function. The Last Night display card continues to use `nights[0]` directly so it always shows the most recent entry regardless of exclusion status.

Pass `analysisNights` to `calcWindowBaseline` and `calcTacticAvg` directly. For `calcBaseline`, pass a `baselineInput` instead:

```js
const baselineInput = lastNight.Excluded
  ? [lastNight, ...analysisNights]
  : analysisNights
const baseline = calcBaseline(baselineInput, sampleSize)
```

`calcBaseline` uses `slice(1)` internally to skip position 0 (last night) and avoid self-reference. If last night is excluded it won't be in `analysisNights`, so `slice(1)` would drop the wrong night. Prepending last night fixes the index without including it in the average.

Note: with this approach `sampleSize=30` scans the 30 most recent *non-excluded* nights, not 30 total logged nights. This is intentional — excluded nights are treated as if they were never recorded for analysis purposes.

- **Tactic delta cards**: excluded nights are absent from both the tactic pool and the baseline pool (via `analysisNights`). Rationale: an excluded night is unreliable regardless of which pool it falls in.
- **Last Night card**: show a small `EXCLUDED` badge if `nights[0].Excluded` is true.
- **Baseline card**: excluded nights are removed from both the average and the displayed night-by-night list (both draw from `analysisNights`).

---

## Data model changes

Two new fields in the Airtable "Nights" table (user adds manually):

| Field | Airtable type | Notes |
|---|---|---|
| Confounders | Multiple select | Options match `src/confounders.js` |
| Excluded | Checkbox | `true` = skip from analysis |

---

## Visual design

### Log screen — new section below Tactics

```
┌─────────────────────────────────────┐
│ EXCEPTIONAL CIRCUMSTANCES [TBD]     │
│                                     │
│ [Late caffeine] [Alcohol]  [Illness]│
│ [Travel]  [Late bedtime]  [+ more]  │
│                                     │
│ ☑ Exclude from experiments          │  ← shown only when no confounders selected
│   (unusual night — skip analysis)   │
└─────────────────────────────────────┘
```

- Same pill/chip style as tactics selector
- Exclude toggle: standard checkbox + 13px muted label; hidden when any confounder is selected (excluded is implicit)
- When confounders are selected, the checkbox is replaced by nothing — exclusion is silent and automatic

### Home screen — Last Night card badge

```
LAST NIGHT                  EXCLUDED
```

- `EXCLUDED` label right-aligned in the card header, muted color (`var(--text-secondary)`)
- Tooltip on the badge shows selected confounders, e.g. *"Excluded: Late caffeine, Alcohol"*. Implemented via `title` attribute. If no confounders were selected (manually excluded), show *"Manually excluded from analysis"*.

---

## Implementation

### New file
- `src/confounders.js` — exports `CONFOUNDER_NAMES` string array

### Changed files
1. **`src/screens/Log.jsx`** — add Confounders picker + Exclude toggle; include `Confounders` and `Excluded` in the `fields` object passed to `saveNight()`/`updateNight()`. Also update the edit-prefill branch in `useState` to include `confounders: editRecord.Confounders ?? []` and `excluded: editRecord.Excluded ?? false` so editing an excluded night preserves its state.
2. **`src/screens/Home.jsx`** — build `analysisNights = nights.filter(n => !n.Excluded)` and pass it to all calc helpers; use `nights[0]` for the Last Night display card; show `EXCLUDED` badge when `nights[0].Excluded` is true.
3. **`src/App.css`** — any new styles for the excluded badge

Note: `src/airtable.js` requires **no changes** — `saveNight()`, `updateNight()`, and `fetchNights()` already pass fields through as-is. Airtable checkbox fields return `true` when checked and omit the field entirely (no `false`) when unchecked, so `n.Excluded` being `undefined` on historical records is expected and handled correctly by `!n.Excluded`.

`Confounders` is always included in `fields` (even as `[]`). Unlike `Notes` and `Body Battery Change`, sending an empty array to Airtable clears the multi-select field, which is the correct behavior for edits.

### Order of work
1. Add Airtable fields manually (prerequisite)
2. `src/confounders.js`
3. `src/screens/Log.jsx` changes
4. `src/screens/Home.jsx` changes

---

## Out of scope

- Excluded nights displayed differently in a history/night-list view (revisit when history view is built)
- Statistical control for confounders (controlling for caffeine rather than excluding)
- Filtering history by confounder type
