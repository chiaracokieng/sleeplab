# Spec 0.2.4 — Nights drill-down

## Goal

Make it possible to sanity-check tactic averages and the baseline by showing the raw contributing nights directly in each card. Right now the tactic effect cards only show averages — there is no way to verify whether a number is driven by one outlier night or a consistent pattern.

---

## Design principle

Each card owns exactly one dataset. Comparison happens through delta values, not by duplicating lists across cards.

| Card | Owns |
|---|---|
| Last Night | Last night's metrics (unchanged) |
| Tactic cards | Nights where that tactic was used |
| Baseline card | Tactic-free nights |

---

## Changes

### 1. Remove the 30/60/90 toggle

The `sampleSize` state and its toggle UI are removed. The window is hardcoded to **the last 30 logged nights**. This applies everywhere: Last Night deltas, tactic averages, and the baseline.

### 2. Tactic cards — experiment nights list

Each tactic card gains a nights list below the metrics row, always visible. Same row format as the current Baseline card table.

```
┌──────────────────────────────────────┐
│ Mouth tape             3 nights so far│
│                                       │
│ Total    7h 12m    +18m vs baseline   │
│ Deep     1h 04m     +9m vs baseline   │
│ REM      1h 48m     +3m vs baseline   │
│ Battery     +22      +4 vs baseline   │
│                                       │
│        Total  Deep   REM   Bat        │
│ Apr 14  7h 20m  1h 10m  1h 52m  +24  │
│ Apr 08  7h 04m  0h 58m  1h 44m  +20  │
│ Mar 31  7h 12m  1h 04m  1h 48m  +22  │
│                                       │
│ [What to expect ▾]                    │
└──────────────────────────────────────┘
```

- Rows are sorted newest first
- Each row is clickable (navigates to edit, same as Baseline rows today)
- "What to expect" blurb toggle remains, positioned below the nights list

### 3. Baseline card — redesigned

The Baseline card is simplified: it drops the toggle and shows the nights list directly.

```
┌──────────────────────────────────────┐
│ Baseline          tactic-free nights  │
│                                       │
│        Total  Deep   REM   Bat        │
│ Avg    7h 02m  0h 58m  1h 42m  +18   │
│                                       │
│ Apr 16  7h 10m  1h 02m  1h 44m  +20  │
│ Apr 12  6h 58m  0h 56m  1h 40m  +16  │
│  ...                                  │
└──────────────────────────────────────┘
```

- Header: "Baseline" label + "tactic-free nights" subtitle (no toggle)
- Avg row remains at the top
- Up to 30 nights shown (the hardcoded window)
- Empty state unchanged: "No tactic-free nights yet"

---

## Data

No new Airtable fields. All computed from `fetchNights()` output.

**Window:** `nights.slice(0, 30)` everywhere. `sampleSize` state is removed; replace all references with the literal `30`.

**Single baseline function:** Use `calcWindowBaseline(analysisNights, 30)` everywhere — Last Night deltas, tactic card deltas, and the Baseline Avg row. Delete `calcBaseline` and `buildBaselineInput`. If `lastNight` is tactic-free and non-excluded, it is included in the baseline pool (1/30 weight; self-reference effect is negligible). All three cards reference the same pool, so numbers are consistent. **Intentional behavior change from today:** the previous `calcBaseline` excluded `nights[0]` to avoid self-reference in the Last Night delta; this spec drops that exclusion. As a result, the Baseline Avg value and the baseline nights list will include lastNight when it is tactic-free. The 1/30 distortion is accepted as negligible in exchange for a single consistent pool.

**Tactic nights list** (per tactic card): nights within the window where `Tactics` includes that tactic name, sorted newest first (already in order from `fetchNights`). Add `nights: pool` to the `calcTacticAvg` return value so the list is available without re-filtering inline.

**Baseline nights list**: nights within the window where `Tactics` is empty or missing, sorted newest first. The Avg row is the mean of this exact pool.

---

## Implementation notes

- Remove `sampleSize` useState and the toggle-group JSX from `Home.jsx`
- Remove `calcBaseline`, `buildBaselineInput` from the `utils` import and delete both functions from `utils.js`; delete their tests from `utils.test.js` (see `decisions.md` 2026-04-18 for the supersession note)
- Remove `windowNights` and `tacticWindowBaseline` from `Home.jsx` — both become dead code once `sampleSize` is removed
- Replace the `baseline` and `tacticWindowBaseline` consts with a single `calcWindowBaseline(analysisNights, 30)` call — used for Last Night deltas, tactic deltas, and the Baseline Avg row
- Remove the `tacticFreeNights` variable; derive the Baseline card rows inline as `analysisNights.slice(0, 30).filter(n => !n.Tactics || n.Tactics.length === 0)`
- Add `nights: pool` to `calcTacticAvg`'s return value; render tactic nights list from `avg.nights`; add a test asserting that `avg.nights` contains exactly the tactic nights within the window (guards against filter regression)
- Add the nights list block inside each tactic card's render, below the metrics grid and above the blurb toggle
- The nights list uses the same `.nights-list`, `.nights-header`, `.night-row`, `.night-row-clickable` classes already used by the Baseline card — no new CSS needed
- Baseline card: remove toggle-group JSX and the `[30, 60, 90].map(...)` block; the rest of the card is unchanged

---

## Edge cases

- **1 tactic night**: list shows 1 row. Subtitle reads "1 night so far" (unchanged).
- **No baseline nights**: Baseline card shows "No tactic-free nights yet" (unchanged).
- **Night with multiple tactics**: appears in each relevant tactic card's list.

---

## Out of scope

- Collapsible experiment nights (always visible is simpler and these lists are short)
- "Show baseline nights" inside tactic cards (Baseline card is the single home for baseline data)
- Any new screens or navigation
- Any changes to Airtable
