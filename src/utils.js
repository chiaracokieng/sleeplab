export function fmtMinutes(mins) {
  if (mins == null || mins === '') return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export function fmtBattery(n) {
  if (n == null || n === '') return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function fmtDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function calcBaseline(nights, sampleSize) {
  // sampleSize = total nights scanned (not tactic-free nights counted). This keeps the baseline
  // and tactic averages on the same time window so deltas are a valid comparison. E.g. with
  // sampleSize=30, both baseline and tactic avg draw only from the last 30 logged nights.
  // nights[0] (last night) is excluded to avoid self-reference in the Last Night delta.
  const pool = nights.slice(1, sampleSize + 1).filter(n => !n.Tactics || n.Tactics.length === 0)
  if (pool.length === 0) return null

  const hasVal = v => v != null && v !== ''
  const avg = arr => arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

  return {
    count: pool.length,
    totalSleep: avg(pool.filter(n => hasVal(n['Total Sleep'])).map(n => n['Total Sleep'])),
    deepSleep: avg(pool.filter(n => hasVal(n['Deep Sleep'])).map(n => n['Deep Sleep'])),
    remSleep: avg(pool.filter(n => hasVal(n['REM Sleep'])).map(n => n['REM Sleep'])),
    bodyBattery: avg(pool.filter(n => hasVal(n['Body Battery Change'])).map(n => n['Body Battery Change'])),
  }
}
