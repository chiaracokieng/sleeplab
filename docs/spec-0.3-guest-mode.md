# Spec — Guest mode (read-only protection)

## Problem

The app is shared with friends for testing, but it contains real data. Friends accidentally modify entries because nothing signals that writes have real consequences.

## Goal

Default everyone to read-only. The owner unlocks write access on their own device with a single tap; that unlock persists so they don't have to repeat it.

---

## How the app knows who's who

It doesn't. There is no user concept. The mechanism is device-local:

- **Unlocked device** (owner's phone/laptop): `localStorage` has a flag set. Stays unlocked across sessions until storage is cleared.
- **New/guest device**: no flag → starts locked. Guest sees a read-only app.

---

## Locked state (what guests see)

### Home screen

- All navigation works normally — guests can tap the FAB, the Last Night card, or any night row and browse freely.
- A small **`🔒 Unlock editing`** button appears in the top-right corner of the header. This is the only unlock point.
- No other UI changes on the home screen.

### Log / edit night screen

- A small **"Read only"** banner appears at the top of the form.
- All form fields appear and feel normal — guests can read the data. Inputs are not visually disabled.
- The **Save / Update** button is visually disabled and does nothing.
- The **Delete** button is visually disabled and does nothing.

---

## Unlock

Tap **`🔒 Unlock editing`** in the Home screen header. A confirmation dialog appears.

---

## Confirmation dialog

Appears after tapping the unlock button. Blocks interaction with the rest of the app while open.

**Content:**

> 😬 **This is Chiara's real sleep data.**
>
> If you enable editing, you could mess it up. You sure?

**Buttons:**

| Label | Action |
|---|---|
| Never mind | Dismiss dialog, app stays locked |
| Unlock editing | Set `localStorage` flag, dismiss dialog, app switches to unlocked state |

Dialog style: slight warm-yellow/orange background or border to signal "caution" — playful, not alarming.

---

## Unlocked state

- **`🔒 Unlock editing`** button is replaced by a **`✏️ Editing unlocked`** badge in the header.
- "Read only" banner disappears. Save / Update and Delete buttons work normally.
- All write interactions work as before.
- State persists in `localStorage` under key `sleeplab_unlocked`.

---

## Implementation notes

- `localStorage` key: `sleeplab_unlocked` — presence of the key (any truthy value) means unlocked.
- `isUnlocked` state lives in `App.jsx`. `App` passes both `isUnlocked` and an `onUnlock` callback to `Home`; `Home` calls `onUnlock()` when the user confirms the dialog. `isUnlocked` is also passed to `Log` as an explicit prop placed after the `{...props}` spread so it takes precedence if `props` ever contains `isUnlocked`.
- Dialog is a simple modal — no library needed, styled inline with existing CSS variables.
- Read-only enforcement is UI-only. No server-side protection. Sufficient for the use case: preventing accidental edits by non-technical friends.

> **Note:** The "🔒 Unlock editing" button appears only in the Home screen header. A guest already on the Log/edit screen has no in-place unlock path — they must tap Back to return to Home first. This is intentional; the friction is acceptable given the use case.

---

## Out of scope

- Multiple users or accounts
- Server-side write protection
- Any persistent "guest session" concept
- Admin password / PIN entry
