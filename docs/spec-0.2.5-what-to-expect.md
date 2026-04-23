# Spec 0.2.5 — What to Expect: target metrics and timeline

## Goal

The "What to expect" toggle in each tactic card currently shows only the mechanism blurb. Add two pieces of information the user actually needs when interpreting their results: which metrics this tactic targets, and a rough timeline for when to see movement.

---

## Changes

### 1. Add two fields to every tactic in `tactics.js`

**`targetMetrics`** — array of metric keys: `totalSleep`, `deepSleep`, `remSleep`, `bodyBattery`. Already planned in spec-0.2; this spec implements it using keys (not display names) so future verdict logic can compare values directly against `calcTacticAvg` output without a lookup.

**`expectTimeline`** — one plain sentence describing the order and timing of expected metric movement.

| Tactic | `targetMetrics` | `expectTimeline` |
|---|---|---|
| Cold room | `['deepSleep', 'totalSleep']` | Deep Sleep often improves in the first week; Total Sleep follows as sleep onset shortens. |
| Blue blockers | `['totalSleep', 'bodyBattery']` | Total Sleep improves in 1–2 weeks as melatonin timing shifts; Body Battery follows. |
| Mouth tape | `['deepSleep', 'totalSleep', 'bodyBattery']` | Deep Sleep and Total Sleep improve in the first week — fewer micro-awakenings means less lost sleep time; Body Battery follows. |
| Caffeine cutoff | `['deepSleep', 'remSleep', 'bodyBattery']` | Deep Sleep and REM both improve within the first week once caffeine clears before bed; Body Battery follows. |
| Morning sunlight | `['remSleep', 'totalSleep', 'bodyBattery']` | REM Sleep improves first (1–2 weeks) as circadian anchoring puts your REM windows at the right time in the night. Total Sleep and Body Battery follow as the clock locks in (2–4 weeks). |
| Consistent wake time | `['remSleep', 'totalSleep', 'bodyBattery']` | REM Sleep improves as circadian anchoring puts your REM windows at the right time (1–2 weeks); Total Sleep follows as you fall asleep at your intended time more reliably; Body Battery improves as the clock locks in (2–4 weeks). |
| No alcohol | `['remSleep', 'bodyBattery']` | REM recovers within the first week of abstinence; Body Battery follows. |
| 528 Hz playlist | `['totalSleep', 'bodyBattery']` | Some randomized studies show faster sleep onset and better subjective sleep quality from bedtime music. Objective metrics (Deep Sleep, REM) are inconsistent across studies — watch Total Sleep and Body Battery over 2–3 weeks. |

**528 Hz blurb replacement** (updated to be honest about the evidence):
> Relaxing music at bedtime can ease pre-sleep anxiety and signal wind-down. Any effect comes from relaxation, not 528 Hz specifically — studies find no evidence the frequency matters, and the "healing frequency" claims originate from numerology, not biology.

The `targetMetrics` for 528 Hz (`['totalSleep', 'bodyBattery']`) reflect the plausible relaxation pathway (faster onset → slightly more total sleep → slightly better HRV recovery), not a strong evidence claim. The `expectTimeline` text makes the evidence quality explicit.

---

### 2. Update the expanded "What to expect" section in `Home.jsx`

Currently (lines 173–175):
```jsx
{tacticInfo && expanded && (
  <p className="card-blurb">{tacticInfo.blurb}</p>
)}
```

Replace with a block that renders three pieces in order:

1. Blurb paragraph (mechanism explanation — unchanged text for most tactics)
2. "Targets:" row — metric chips, only rendered if `tacticInfo.targetMetrics` is present
3. Timeline paragraph — only rendered if `tacticInfo.expectTimeline` is present

Add a lookup at the top of `Home.jsx` (or alongside other constants):

```js
const METRIC_LABELS = {
  totalSleep: 'Total Sleep',
  deepSleep: 'Deep Sleep',
  remSleep: 'REM Sleep',
  bodyBattery: 'Body Battery',
}
```

```jsx
{tacticInfo && expanded && (
  <div className="card-blurb-block">
    <p className="card-blurb">{tacticInfo.blurb}</p>
    {tacticInfo.targetMetrics?.length > 0 && (
      <div className="expect-metrics">
        <span className="expect-metrics-label">Targets</span>
        <div className="expect-metrics-chips">
          {tacticInfo.targetMetrics.map(k => (
            <span key={k} className="expect-metric-chip">{METRIC_LABELS[k]}</span>
          ))}
        </div>
      </div>
    )}
    {tacticInfo.expectTimeline && (
      <p className="card-blurb-timeline">{tacticInfo.expectTimeline}</p>
    )}
  </div>
)}
```

The timeline paragraph uses `card-blurb-timeline` (not `card-blurb`) to avoid inheriting the `border-top` that `.card-blurb` uses as a separator from card content above.

---

### 3. CSS additions in `App.css`

```css
.card-blurb-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.expect-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.expect-metrics-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.expect-metrics-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-right: 0.25rem;
}

.expect-metric-chip {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--text-secondary);
}

.card-blurb-timeline {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}
```

---

## Out of scope

- No changes to Airtable or `airtable.js`
- No changes to tests (data-only addition to `tactics.js`; JSX change has no pure-function logic to test)
- No changes to `Log.jsx`
- Custom tactics (stored in localStorage) have no `targetMetrics` or `expectTimeline` — the conditional rendering handles this gracefully (both fields simply absent)
