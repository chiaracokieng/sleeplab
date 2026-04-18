# Decisions

## Product

## Architecture

* 2026-04-17: **Keep architecture documentation in CLAUDE.md, no separate architecture.md**. Reason: CLAUDE.md already covers architecture, file structure, data model, and key decisions. A separate file would duplicate content and drift out of sync.

## Engineering

* 2026-04-18: **Extract exclusion filtering into `filterExcluded` / `buildBaselineInput` utils**. The inline logic in Home.jsx had a subtle contract: `calcBaseline` skips `nights[0]` via `slice(1)`, so an excluded lastNight had to be prepended even though it wasn't in `analysisNights`. Extracting this into tested utils makes the invariant explicit and prevents regressions. — **Superseded by spec 0.2.4**: `calcBaseline` and `buildBaselineInput` are deleted; `calcWindowBaseline` replaces them everywhere and handles the excluded-lastNight case naturally (excluded nights are absent from `analysisNights`, so no prepend workaround is needed). The skip-first-night invariant is intentionally dropped; lastNight contributes to its own baseline at 1/30 weight, which is accepted as negligible.

* 2026-04-18: **Tactic blurb shown inline via expand toggle, not on a separate screen**. Keeps the user in context while reviewing their data. Custom tactics (not in `DEFAULT_TACTICS`) silently omit the toggle rather than showing an empty state.

* 2026-04-11: **Use Airtable instead of Google Sheets for storing data**. Reason: Airtable's API is very simple, whereas Google Sheets's is moderately complex. For my first vibe coding project, I want to spend less time fighting auth and more time building the actual app.
