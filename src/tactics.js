// impact + doability: high=3, medium=2, low=1
// ranked by (impact + doability), ties broken by doability
export const DEFAULT_TACTICS = [
  {
    name: 'Cold room',
    impact: 3,
    doability: 3,
    blurb: 'Sleep onset requires core body temperature to drop 1–2°F. A cool room (65–68°F) accelerates this, deepening sleep.',
    source: 'Walker, thermoregulation research',
  },
  {
    name: 'Blue blockers',
    impact: 2,
    doability: 3,
    blurb: 'Blue light delays melatonin release, pushing back your natural sleep window. Blocking it 2–3 hours before bed lets melatonin rise on schedule, so you fall asleep faster and at your intended bedtime.',
    source: 'Huberman Lab, melatonin suppression research',
  },
  {
    name: 'Mouth tape',
    impact: 2,
    doability: 3,
    blurb: 'Mouth breathing causes more snoring and micro-awakenings through the night. Nasal breathing reduces these interruptions, giving you more continuous sleep and more time in deep sleep.',
    source: 'Growing clinical evidence, Huberman Lab',
  },
  {
    name: 'Caffeine cutoff',
    impact: 3,
    doability: 2,
    blurb: 'Caffeine blocks adenosine receptors for up to 10 hours, reducing deep sleep even when you fall asleep without trouble.',
    source: 'Walker "Why We Sleep", multiple RCTs',
  },
  {
    name: 'Morning sunlight',
    impact: 3,
    doability: 2,
    blurb: 'Triggers a morning cortisol pulse that anchors your circadian clock, making it easier to fall asleep at a consistent time.',
    source: 'Huberman Lab, circadian biology research',
  },
  {
    name: '528 Hz playlist',
    impact: 1,
    doability: 3,
    blurb: 'A calming playlist can ease pre-sleep anxiety and create a consistent wind-down ritual. Any benefit comes from relaxation, not the specific frequency.',
    source: 'General relaxation research; 528 Hz frequency claims are not evidence-based',
  },
  {
    name: 'Consistent wake time',
    impact: 3,
    doability: 1,
    blurb: 'Anchors your circadian rhythm. Even one lie-in can delay your sleep phase by 1–2 hours, making it harder to fall asleep the following night.',
    source: 'CBT-I (core intervention), AASM',
  },
  {
    name: 'No alcohol',
    impact: 3,
    doability: 1,
    blurb: 'Alcohol sedates rather than induces sleep — it fragments the second half of the night and suppresses REM by up to 25%.',
    source: 'Walker, polysomnography research',
  },
]

export const TACTIC_NAMES = DEFAULT_TACTICS.map(t => t.name)
