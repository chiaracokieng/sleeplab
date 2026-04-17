# Spec 0.2.1 — Tactic card

> **Draft** — implementation not started. Continuing later.

## Goal

When last night's log includes a tactic, show a card on the Home screen that names the tactic, tells the user which night they're on, and reminds them *why* the tactic works. Makes each log feel like progress rather than a data entry.

This is a stepping stone toward the full experiment card (spec 0.2), which will add delta metrics and a verdict. The structure should be compatible.

---

## Behaviour

The card appears on Home **only when last night's log includes at least one tactic**. No card if last night had no tactics.

### "Night X" calculation

Count consecutive nights — going back from and including last night — where the tactic appears in `Tactics`. Stop at the first night that doesn't include it. The count is the streak length.

Example: if nights[0] has Mouth Tape, nights[1] has Mouth Tape, nights[2] does not → Night 2.

This uses the already-fetched `nights` array; no extra Airtable call.

### Multiple tactics on last night

Show the card for the tactic with the **longest current streak** among last night's tactics. Ties broken by `DEFAULT_TACTICS` order. If none of last night's tactics are in `DEFAULT_TACTICS` (i.e. all custom), use the first tactic in last night's `Tactics` array.

Only one tactic card is shown at a time.

### No blurb available (custom tactic)

If the tactic has no entry in `DEFAULT_TACTICS`, show the name and night count only — omit the blurb row.

---

## Visual design

Standard `.card` container. Positioned between the Last Night card and the Baseline card.

```
┌─────────────────────────────────────┐
│ ACTIVE EXPERIMENT      Night 2      │
│                                     │
│ Mouth Tape                          │
│                                     │
│ Mouth breathing causes more snoring │
│ and micro-awakenings through the    │
│ night. Nasal breathing reduces...   │
└─────────────────────────────────────┘
```

- Card label: `ACTIVE EXPERIMENT` (same `.card-label` style as other cards)
- Right-aligned: `Night X` in `.card-date` style
- Tactic name: 17px, `var(--text-h)`, `font-weight: 600`
- Blurb: 14px, `var(--text)`, normal weight; no truncation

No interactive elements in this phase.

---

## Implementation

All changes in `src/screens/Home.jsx`:

1. Import `DEFAULT_TACTICS` from `../tactics`.
2. Compute `activeTactic` and `streakCount` from `nights[0].Tactics` and the `nights` array.
3. Render the card between the Last Night card and the Baseline card.

No new files, no CSS additions needed — existing card classes cover all the styles above.

---

## Out of scope

- Tap to expand / bottom sheet
- Delta metrics vs baseline (spec 0.2 experiment card)
- "Start experiment" CTA
- Multiple simultaneous tactic cards
