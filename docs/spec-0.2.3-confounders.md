# Spec 0.2.3 — Confounders & experiment exclusion

> **Status: draft — needs owner review before implementation.**

## Goal

Let the user flag a night as **exceptional** — something unusual happened that would distort tactic analysis. Flagged nights are excluded from tactic effect calculations so the data stays clean.

Core question this answers: *"Is this result signal or noise?"*

---

## Behaviour

### Logging confounders

On the Log screen, below the Tactics section, add:

1. **Exceptional circumstances** — multi-select from a predefined list (same UX as tactics picker). User can pick multiple. (Note: "confounders" is the research term but needs a more user-friendly label — TBD e.g. "unusual circumstances", "exceptions", "what else happened".)
2. **Exclude from experiments** — checkbox toggle. When checked, this night is excluded from all tactic delta calculations.

**Auto-suggest**: if any confounder is selected, the Exclude toggle is automatically checked. The user can manually uncheck it if they disagree.

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

### Effect on analysis (Home screen)

- **Tactic delta cards**: skip excluded nights from both the tactic pool and the baseline pool. Rationale: an excluded night is unreliable regardless of which pool it falls in.
- **Last Night card**: show a small `EXCLUDED` badge if last night was flagged.
- **Baseline card**: excluded nights are removed from the baseline average.

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
│ ☑ Exclude from experiments          │
│   (unusual night — skip analysis)   │
└─────────────────────────────────────┘
```

- Same pill/chip style as tactics selector
- Exclude toggle: standard checkbox + 13px muted label
- Auto-checked when confounders selected; user can override

### Home screen — Last Night card badge

```
LAST NIGHT                  EXCLUDED
```

- `EXCLUDED` label right-aligned in the card header, muted color (`var(--text-secondary)`)

---

## Implementation

### New file
- `src/confounders.js` — exports `CONFOUNDER_NAMES` string array

### Changed files
1. **`src/screens/Log.jsx`** — add Confounders picker + Exclude toggle; wire to `saveNight()`
2. **`src/airtable.js`** — `saveNight()` sends `Confounders` and `Excluded`; `fetchNights()` returns them
3. **`src/screens/Home.jsx`** — filter excluded nights before baseline + delta calculations; show badge on Last Night card
4. **`src/App.css`** — any new styles for the excluded badge

### Order of work
1. Add Airtable fields manually (prerequisite)
2. `src/confounders.js`
3. `src/airtable.js` changes
4. `src/screens/Log.jsx` changes
5. `src/screens/Home.jsx` changes

---

## Open questions

- Should confounders be visible anywhere on Home (e.g. tooltip on the EXCLUDED badge)? Or log-only?
- Should excluded nights show differently in a future night history view?

---

## Out of scope

- Free-text "other" confounder (could add later)
- Statistical control for confounders (controlling for caffeine rather than excluding)
- Filtering history by confounder type
