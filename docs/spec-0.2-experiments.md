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
 ├── Shows what the tactic is expected to improve (read-only, app decides)
 └── Confirm  →  Home (experiment starts, card updates)

Log screen (nightly, nights 1–6)
 ├── Active tactic pre-selected, soft warning if deselected
 └── Each log updates the running result in the experiment card

After night 7
 └── Current experiment card shows final result + overall conclusion + "Start new" CTA
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
- Motivational blurb from `tactics.js` `blurb` field (same text as shown in the tactic list)
- All 4 metrics shown with headline delta vs baseline; targeted metrics visually distinguished (bold or accent color)
- Card updates each time the user logs a night
- Tap card → bottom sheet with full sparkline detail (see below)

**Complete (night 7+)**
- Same summary card layout; tap → bottom sheet
- Bottom sheet shows all 4 metrics, deltas, sparklines for all 7 nights + overall conclusion sentence
- CTA: "Start new experiment"

**Bottom sheet (active + complete)**
- Per metric row: name · running average delta · sparkline
  - Sparkline: per-night raw values as dots, baseline mean as a fixed horizontal reference line; ~80×20px, no axes or labels
- Targeted metrics visually distinguished
- Complete state adds the conclusion sentence below the metrics

---

### Tactic list screen ("Improve my sleep")

- Ranked list of tactics, ordered by score (see [tactics-research.md](./tactics-research.md))
- Each row shows: tactic name · impact level · doability level · one-line blurb
- Tap a tactic → Commit screen

---

### Commit screen

- "Try [Tactic] for 7 nights"
- Shows specific guidance for the tactic (see below)
- **Target metrics section**: read-only, app-determined. Displays which metrics this tactic is expected to improve (e.g. "Expected to improve: Deep Sleep, Body Battery"). User cannot add or remove metrics.
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

## Target metrics per tactic

Each tactic has a fixed set of metrics it is most likely to move, based on the mechanism of action. These are app-determined and not editable by the user.

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

These thresholds are used internally to generate the overall conclusion sentence — they are not shown as per-metric labels to the user.

Each targeted metric is scored by comparing the 7-night experiment average to the baseline average:

| Score | Condition |
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

**Why these thresholds exist — the Garmin data problem**

Garmin sleep tracking is consumer-grade, not medical-grade. Two sources of noise make raw nightly numbers unreliable on their own:

1. **Device noise**: Garmin's algorithm estimates sleep stages from wrist movement and heart rate. It can misclassify light sleep as deep, or miss brief awakenings. The error margin on any single night is meaningful — probably ±5–10 min for deep/REM sleep stages.

2. **Biological variability**: Even without any intervention, your sleep varies night to night. Total sleep alone can swing 20–30 min just from minor differences in stress, timing, or temperature. This is normal and not signal.

The thresholds are set to be larger than device noise (so a verdict isn't triggered by measurement error) but small enough to catch a genuine effect over 7 nights. Averaging 7 nights helps substantially — random noise cancels out, real effects accumulate.

Implication for the user: a 3-minute improvement in deep sleep on one night means nothing. A 7-minute average improvement across 7 nights, consistently above baseline, is worth paying attention to.

> **Future**: surface a version of this explanation in the app — either as a tooltip on the verdict, or as a short "how to read this" note in the bottom sheet. The goal is to teach the user to interpret their own Garmin data more accurately, not just report numbers.

**Conclusion template logic** (applied to targeted metrics only):

| Outcome | Conclusion sentence |
|---|---|
| 2+ targeted metrics are Yes | "[Tactic] meaningfully improved your [metrics]. Worth continuing." |
| 1 Yes + 1 Marginal | "[Tactic] showed modest improvement in [metrics]. Results are encouraging but not conclusive." |
| All Marginal | "[Tactic] had a small effect on [metrics] — not enough to be confident. Try more nights or a different tactic." |
| All No | "No meaningful change across 7 nights. [Tactic] may not be the right lever for your sleep." |

> **Future upgrade**: replace template logic with a Claude API call at completion time, storing the generated text back to Airtable. See Out of scope.

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
- Claude API-generated conclusion (upgrade to current template-based conclusion; call happens once at night 7, result stored in Airtable)
