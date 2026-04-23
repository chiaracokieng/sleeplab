# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm test          # Run Vitest (pure function unit tests)
```

Tests live in `src/__tests__/`. See `docs/test.md` for what's covered and the checklist for new code.

## What this app is

Sleep Lab is a PWA that lets the user log nightly sleep metrics from Garmin Connect and measure which sleep tactics (mouth tape, blue blockers, etc.) actually improve their sleep. Data is stored in Airtable — no custom backend.

The core question: **How does doing X change my sleep quality?**

## Architecture

- **React 19 + Vite** — single-page app, two screens
- **Screen navigation**: `useState` in `App.jsx` (planned migration to react-router later). Screens receive a `navigate` function as a prop.
- **Guest mode**: `isUnlocked` boolean state lives in `App.jsx`, seeded from `localStorage` key `sleeplab_unlocked`. Passed as an explicit prop to both `Home` (plus `onUnlock` callback) and `Log`. Locked state disables Save and Delete; `Home` shows a confirmation dialog before unlocking.
- **Data storage**: Airtable REST API via `src/airtable.js`
- **Env vars**: `VITE_AIRTABLE_TOKEN` and `VITE_AIRTABLE_BASE_ID` in `.env` (not committed)

## File structure

```
src/
  airtable.js       — fetchNights() and saveNight(fields); handles Airtable pagination
  tactics.js        — DEFAULT_TACTICS (objects with name, impact, doability, blurb, source) + TACTIC_NAMES (string array)
  confounders.js    — CONFOUNDER_NAMES (string array)
  screens/
    Home.jsx        — Last Night card + Baseline card with 7/30/90 toggle
    Log.jsx         — Entry form; custom tactics persisted to localStorage
  App.jsx           — Screen switcher
  App.css           — All app-specific styles
  index.css         — Base styles and CSS variables (colors, fonts)
docs/
  decisions.md
  spec-0.1-core.md
  spec-0.2-experiments.md
  spec-0.2.1-tactic-card.md
  spec-0.3-guest-mode.md
  tactics-research.md
```

## Data model (Airtable — "Nights" table)

| Field | Airtable type | Notes |
|---|---|---|
| Night | Formula (primary) | `DATETIME_FORMAT({Date}, 'YYYY-MM-DD')` |
| Date | Date | Morning the user woke up |
| Total Sleep | Number | Stored in **minutes**, displayed as `Xh Ym` |
| Deep Sleep | Number | Minutes |
| REM Sleep | Number | Minutes |
| Body Battery Change | Number | Signed integer; user types `-` explicitly |
| Tactics | Multiple select | Options match `DEFAULT_TACTICS` in `tactics.js` |
| Confounders | Multiple select | Options match `CONFOUNDER_NAMES` in `confounders.js` |
| Excluded | Checkbox | True when confounders selected or manually checked; night omitted from all analysis |
| Notes | Long text | Optional |

**Baseline** = average of nights with no tactics selected, within the chosen time window (7 / 30 / 90 days).

## Key decisions

- Sleep fields stored in minutes, converted to `h m` at display time only
- Body Battery Change omitted from the Airtable record if left blank
- Custom tactics stored in `localStorage` under key `sleeplab_custom_tactics`
- `navigate` prop pattern chosen to make future react-router migration straightforward
- `isUnlocked` passed as an explicit prop to `Log` (not via the navigate `props` spread) so the spread cannot accidentally shadow it
