# Sleep Lab

A progressive web app to make use of Garmin's sleep data and measure which tactics actually improve your sleep.

## Why build this? 

I have a Garmin Forerunner 245 that tracks my sleep every night, but the Garmin Connect interface doesn't help me actually understand it. I want to know which sleep best practices — like mouth tape — actually work for me, and by how much.

I considered buying an Oura Ring or an Ultrahuman Ring (no subscription). But from what I read, Garmin’s sensors and algorithms are comparable, so I'd essentially be paying for a user interface. 

Instead, I decided to use this as an opportunity to learn vibe coding and build the interface myself.

## The core question this app answers
> How does doing X change my sleep quality?

## v1
### What I track
Entered manually each morning from Garmin Connect:
* Total Sleep
* Deep Sleep
* REM Sleep
* Body Battery Change

### Screens
1. **Home** — Last night's stats compared to my baseline (non-tactics nights), with a toggle for last 7 / 30 / 365 days.
2. **Log** — A form to enter last night's metrics and tag which tactics I tried.

### Tactics
Pre-loaded list ranked by scientific evidence, plus the ability to add my own:
* Consistent wake time
* Caffeine cutoff
* No alcohol
* Blue blockers
* Morning sunlight
* Cold room
* Mouth tape

### Tech
* **PWA (Progressive Web App)** — works like an app on iPhone without needing the App Store. 
* **Data stored in Airtable** — no data loss if switching phones or clearing the browser

### Out of scope for v1
* Automatic Garmin sync
* HRV (not available on Forerunner 245)
* Dedicated insights screen
* Quality of life correlation
* CSV import
* Custom backend / server