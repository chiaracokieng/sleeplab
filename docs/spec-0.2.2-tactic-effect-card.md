# Spec 0.2.2 — Tactic effect card

> **Supersedes spec 0.2.1** (tactic card with streak + blurb). That spec is abandoned; this one replaces it.

## Goal

Show the user the average effect of each tactic they have tried, compared to their baseline, using data already logged.

---

## UI

A tactic effect card is added to the Home screen below the Baseline card, once for each tactic that appears on at least one logged night within the selected window.

```
┌──────────────────────────────────────┐
│ Mouth tape             2 nights so far│
│                                       │
│ Total    7h 12m    +18m vs baseline   │
│ Deep     1h 04m     +9m vs baseline   │
│ REM      1h 48m     +3m vs baseline   │
│ Battery     +22      +4 vs baseline   │
└──────────────────────────────────────┘
```

- Card label: tactic name
- Card subtitle: "X night so far" / "X nights so far" (count within the selected window)
- Metrics layout: identical to the Last Night card
- Delta label: "vs baseline" (not "vs avg" — requires a `label` prop on the `Delta` component; see Implementation)
- Cards are ordered by number of nights within the window, descending (most data first)
- The window toggle has three options: **30**, **60**, and **90** days (the 7-day option is removed — it's too short for a meaningful tactic experiment and would often have no baseline nights at all). Because `sampleSize` is shared state across the whole Home screen, removing 7 also removes the 7-day comparison from the Last Night card's deltas. This is intentional: a 7-day window is equally unreliable for Last Night comparisons once the user is running experiments.
- Both sides of every delta draw from the same pool: `nights.slice(0, sampleSize)`, filtered differently — tactic avg keeps nights with the tactic; baseline keeps tactic-free nights

---

## Data

No new Airtable tables or fields. Computed entirely from the nights already returned by `fetchNights()`.

**What `sampleSize` means:** the toggle (30 / 60 / 90) sets the number of **total logged nights** to scan — not the number of tactic-free or tactic nights. Both the baseline and tactic averages draw from the same `nights.slice(0, sampleSize)` pool, so both sides of every delta cover the same time period.

This matters because the alternative — "30 tactic-free nights" for the baseline — would silently reach back months if the user experiments frequently, making the baseline reflect old sleep patterns rather than the same period as the tactic. The expected usage pattern is one tactic at a time in ~7-night blocks, so the 30-day window typically captures one or two experiment runs plus the tactic-free nights between them: a genuine same-period control group.

Note: the baseline used here (`nights.slice(0, sampleSize)` filtered for tactic-free nights) is **not** the same computation as `calcBaseline`, which uses `slice(1, sampleSize+1)` to exclude last night from the Last Night card's self-reference. Tactic card deltas need a same-pool baseline; see Implementation for how this is handled.

> **Note — user-visible inconsistency:** when `nights[0]` is tactic-free, the average shown in the Baseline card (`calcBaseline`, excludes nights[0]) and the baseline used in tactic delta labels ("vs baseline", from `calcWindowBaseline`, includes nights[0]) will be slightly different numbers despite both being labeled "baseline." This is an intentional trade-off: the tactic deltas need a same-pool control, while the Last Night card needs nights[0] excluded to avoid self-reference. A user who cross-checks values may notice. If this becomes confusing in practice, consider labeling the tactic delta as "vs window avg" instead.

**Per tactic:**
1. From `nights.slice(0, sampleSize)` (including `nights[0]`), collect nights where the tactic appears in `Tactics`
2. Average each metric across those nights (same arithmetic as `calcBaseline`)
3. Delta = tactic average − baseline average

**New helper — `calcTacticAvg(nights, tacticName, sampleSize)`** in `src/utils.js`:
- Does **not** apply the `slice(1)` offset that `calcBaseline` uses (that offset exists only to exclude "last night" from the baseline self-reference; tactic averaging has no such constraint)
- Filters `nights.slice(0, sampleSize)` for nights where `Tactics` includes `tacticName`
- Returns the same shape as `calcBaseline` (`{ count, totalSleep, deepSleep, remSleep, bodyBattery }`) or `null` if no matching nights

If a metric value is missing on a night, exclude that night from that metric's average (same handling as `calcBaseline`).

---

## Implementation notes

**`Delta` component:** the `label` prop (default `"avg"`) is already implemented. Tactic effect cards pass `label="baseline"` — no changes needed to `Delta`.

**`calcTacticAvg`:** add to `src/utils.js` alongside `calcBaseline`. Uses `nights.slice(0, sampleSize)` — no `slice(1)` offset. Add unit tests in `src/__tests__/utils.test.js` covering: null return when no matching nights, correct average, missing-field exclusion per metric, `sampleSize` cap, and correct `count`.

**`calcWindowBaseline`:** add a second new helper to `src/utils.js` — `calcWindowBaseline(nights, sampleSize)` — that uses `nights.slice(0, sampleSize)` (no offset) to compute the tactic-free average. Do **not** modify `calcBaseline`; its `slice(1)` offset is specific to the Last Night card and changing the signature for one call site adds noise to a stable, well-tested function.

> **Note — two nearly identical functions:** `calcWindowBaseline` and `calcBaseline` differ only in their slice offset. If averaging logic ever changes (e.g. weighted averages, new metric exclusion rule), both functions must be updated. Accepted trade-off to keep `calcBaseline` stable and its call site unchanged.

> **Note — update `Home.jsx` import:** when adding these helpers, also update the import on line 4 of `src/screens/Home.jsx` to include `calcWindowBaseline` and `calcTacticAvg`.

**Tactic enumeration and sorting:** in `Home.jsx`, build `windowNights` once and use it for both the baseline and tactic averages:

```js
const windowNights = nights.slice(0, sampleSize)
const tacticWindowBaseline = calcWindowBaseline(nights, sampleSize)

const tacticNames = [...new Set(windowNights.flatMap(n => n.Tactics ?? []))]

const tacticAvgs = tacticNames
  .map(name => ({ name, avg: calcTacticAvg(nights, name, sampleSize) }))
  .filter(t => t.avg !== null)
  .sort((a, b) => b.avg.count - a.avg.count)
```

Render one tactic effect card per entry in `tacticAvgs`, passing `tacticWindowBaseline` as the baseline for deltas.

**Baseline card row list:** `sampleSize` is shared state, so the Baseline card's night-by-night list will now show up to 60 or 90 rows. This is intentional — the longer windows give a fuller picture of the tactic-free history. No pagination needed at this stage.

**Toggle change:** the `[7, 30, 90]` array in `Home.jsx` becomes `[30, 60, 90]`. The `sampleSize` default of `30` is unchanged.

All other changes in `src/screens/Home.jsx`.

---

## Edge cases

- **No baseline**: if `tacticWindowBaseline` is null (no tactic-free nights in the selected window), show `—` for all deltas. Same behaviour as the Last Night card today.
- **No tactics logged in the window**: no tactic effect cards are shown for that window.
- **1 night**: card is shown. The subtitle reads "1 night so far".

---

## Out of scope

- Verdict or conclusion sentences
- Sparklines
- Minimum night thresholds before showing a card
- Any new screens or navigation
- Any changes to Airtable
