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

The `sampleSize` state and its toggle UI are removed. The window is hardcoded to **30 days** (the last 30 logged nights). This applies everywhere: Last Night deltas, tactic averages, and the baseline.

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

**Tactic nights list** (per tactic card): nights within the window where `Tactics` includes that tactic name, sorted newest first (already in order from `fetchNights`).

**Baseline nights list**: nights within the window where `Tactics` is empty or missing, sorted newest first.

---

## Implementation notes

- Remove `sampleSize` useState and the toggle-group JSX from `Home.jsx`
- Replace all `sampleSize` references with `30`
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
