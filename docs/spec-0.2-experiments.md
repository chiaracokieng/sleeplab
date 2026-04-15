# Spec 0.2 — Experiments feature

## Goal

Answer the core question: **"Does tactic X actually improve my sleep?"**

Without this, Sleep Lab is a data logger. With it, it's a lab.

---

## High-level flow

```
Home
 ├── Current experiment card  (always visible)
 ├── "Improve my sleep" button  →  Tactic list
 └── "Log" button  →  Log screen (unchanged, except active tactic pre-selected)

Tactic list
 └── Tap a tactic  →  Commit screen

Commit screen
 ├── Shows suggested target metrics for this tactic (user can add/remove)
 └── Confirm  →  Home (experiment starts, card updates)

Log screen (nightly)
 └── Active tactic pre-selected, soft warning if deselected

After night 7
 └── Current experiment card shows final result + per-metric verdict + "Start new" CTA
```

---

## Screens & components

### Current experiment card (Home)

Always shown on the Home screen. Three states:

**No active experiment**
> "Want to improve your sleep? Start an experiment →"
Links to tactic list.

**Active experiment (nights 1–6)**
- Tactic name + "Night X of 7" progress
- Running average of experiment nights vs baseline (updates each time user logs)
- Only the targeted metrics are shown (not all four columns); non-targeted metrics are omitted

**Complete (night 7+)**
- Final averaged result vs baseline for each targeted metric
- Per-metric verdict: "Yes" / "No" / "Marginal" (see verdict rules below)
- CTA: "Start new experiment"

---

### Tactic list screen ("Improve my sleep")

- Ranked list of tactics, ordered by score (see [tactics-research.md](./tactics-research.md))
- Each row shows: tactic name · impact level · doability level · one-line blurb
- Tap a tactic → Commit screen

---

### Commit screen

- "Try [Tactic] for 7 nights"
- Shows specific guidance for the tactic (see below)
- **Target metrics section**: pre-populated with the tactic's suggested metrics; user can toggle each metric on/off before confirming. At least one metric must remain selected.
  - Label: "What are you hoping to improve?"
  - Options: Total Sleep · Deep Sleep · REM Sleep · Body Battery
  - Suggested ones are pre-checked; others unchecked
- Confirm → saves experiment to Airtable, returns to Home

---

## Tactic-specific guidance

Shown on the commit screen when the user starts an experiment. Be concrete — give a specific instruction plus the principle so the user can adapt it to their schedule.

> **TODO**: once copy is finalised here, add a `guidance` field to each tactic in `tactics.js`.

| Tactic | Specific instruction |
|---|---|
| Cold room | Set your room to 65–68°F (18–20°C) before bed |
| Blue blockers | Put them on 2–3 hours before your target bedtime |
| Mouth tape | Apply just before lights out |
| Caffeine cutoff | Last caffeine by 1–2pm. Principle: caffeine has a ~10hr half-life, so cut off at least 10 hours before your target bedtime and adjust from there |
| Morning sunlight | 10+ minutes outdoors within 1 hour of waking, no sunglasses |
| Consistent wake time | Same wake time ±30 min every day, including weekends |
| No alcohol | None within 3 hours of bedtime |

---

## Suggested target metrics per tactic

Each tactic pre-selects the metrics it is most likely to move, based on the mechanism of action. The user can override before confirming.

| Tactic | Suggested metrics | Rationale |
|---|---|---|
| Cold room | Deep Sleep, Total Sleep | Core temp drop accelerates sleep onset and deepens slow-wave sleep |
| Blue blockers | Total Sleep, Body Battery | Earlier melatonin onset → earlier sleep onset → more total sleep and better recovery |
| Mouth tape | Deep Sleep, Body Battery | Fewer micro-awakenings → more continuous sleep and deeper slow-wave |
| Caffeine cutoff | Deep Sleep, REM Sleep | Adenosine block specifically suppresses deep and REM sleep |
| Morning sunlight | Total Sleep, Body Battery | Anchors circadian rhythm → more consistent sleep timing and recovery |
| Consistent wake time | Total Sleep, Body Battery | Reduces sleep phase drift → more time asleep and better recovery |
| No alcohol | REM Sleep, Body Battery | Alcohol fragments the second half of the night and suppresses REM by up to 25% |

---

### Log screen (modified)

- If active experiment: tactic pre-selected
- Soft warning if user tries to deselect the active tactic (don't block, just flag)

---

## Verdict rules (Complete state)

Applied per targeted metric, comparing the 7-night experiment average to the baseline average.

| Label | Condition |
|---|---|
| **Yes** | Experiment average beats baseline by more than the noise threshold |
| **Marginal** | Experiment average beats baseline but within the noise threshold |
| **No** | Experiment average is at or below baseline |

Noise thresholds (chosen to be meaningful given Garmin's precision):
- Total Sleep: > 10 min improvement → Yes
- Deep Sleep: > 5 min improvement → Yes
- REM Sleep: > 5 min improvement → Yes
- Body Battery: > 3 points improvement → Yes

Values between 0 and the threshold → Marginal. At or below 0 → No.

---

## Data

### `tactics.js` — updated structure
Each tactic now has: `name`, `impact` (1–3), `doability` (1–3), `blurb`, `source`, `targetMetrics` (array of metric keys).

Metric keys: `totalSleep`, `deepSleep`, `remSleep`, `bodyBattery`.

See [tactics-research.md](./tactics-research.md) for full rationale.

### Airtable — new `Experiments` table

| Field | Type | Notes |
|---|---|---|
| Tactic | Single line text | Matches tactic name |
| Start date | Date | Date experiment began |
| Status | Single select | active / complete |
| Target metrics | Multiple select | Options: Total Sleep, Deep Sleep, REM Sleep, Body Battery |

---

## Ranking logic

`score = impact + doability`, ties broken by doability (higher doability wins).

Current order: Cold room → Blue blockers → Mouth tape → Caffeine cutoff → Morning sunlight → Consistent wake time → No alcohol.

---

## Out of scope (later)

- Past experiments screen
- Multiple simultaneous experiments
- User-editable tactic ratings
- Statistical significance display
