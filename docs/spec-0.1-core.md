# Plan v1 of the basic app

The most basic version possible.

## Data Model

**Nights Table**

One row per night:

| Field | Type | Example | Notes |
|---|---|---|---|
| Date | Date | Apr 11 2026 | The morning you woke up | 
| Total Sleep | Number | 368 | Stored in minutes, displayed as h m |
| Deep Sleep | Number | 113 | Stored in minutes, displayed as h m |
| REM Sleep | Number | 40 | Stored in minutes, displayed as h m |
| Body Battery Change | Number | +56 | Stored as signed integer; expected positive in most cases; user enters negative explicitly if needed |
| Tactics | Multi-select | Mouth tape, Blue blockers | Pre-loaded options defined in app code, plus ability to add custom values |
| Notes | Text | felt groggy | | Optional

Baseline is the average of nights within the selected time window (7/30/365) where no tactics were selected.

## Home Screen

From top to bottom:
1. **Last Night card** — date + Total Sleep, Deep Sleep, REM, Body Battery Change
2. **Baseline card** — 7 / 30 / 365 toggle + same four metrics averaged across nights with no tactics selected in that window
3. **Log Last Night button** — bottom right

Baseline is the average of nights within the selected time window (7/30/365) where no tactics were selected.

**Empty states**: 
* No nights logged yet: prompt "Enter your last 7 nights to establish your baseline" with a button into the Log screen
* Baseline card with no tactic-free nights in the selected window: show "Not enough baseline data in this window"

## Log Screen
Where you enter last night's data each morning.

1. Total Sleep — h m inputs
2. Deep Sleep — h m inputs
3. REM Sleep — h m inputs
4. Body Battery Change — number input (positive by default; enter negative explicitly if needed)
5. Tactics — tappable chips in single-column layout; suggests one selection without enforcing it
6. Notes — optional text field
7. Save button — returns to home screen


