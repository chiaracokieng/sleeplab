import { useState, useEffect } from 'react'
import { fetchNights } from '../airtable'

function fmtMinutes(mins) {
  if (mins == null || mins === '') return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function fmtBattery(n) {
  if (n == null || n === '') return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function calcBaseline(nights, days) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const baseline = nights.filter(n => {
    const date = new Date((n.Date || '').slice(0, 10) + 'T12:00:00')
    return date >= cutoff && (!n.Tactics || n.Tactics.length === 0)
  })
  if (baseline.length === 0) return null
  const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  return {
    count: baseline.length,
    totalSleep: avg(baseline.map(n => n['Total Sleep'] || 0)),
    deepSleep: avg(baseline.map(n => n['Deep Sleep'] || 0)),
    remSleep: avg(baseline.map(n => n['REM Sleep'] || 0)),
    bodyBattery: avg(baseline.map(n => n['Body Battery Change'] || 0)),
  }
}

export default function Home({ navigate }) {
  const [nights, setNights] = useState(null)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchNights()
      .then(setNights)
      .catch(e => setError(e.message))
  }, [])

  if (error) return <div className="screen"><p className="error">{error}</p></div>
  if (nights === null) return <div className="screen"><p className="loading">Loading…</p></div>

  if (nights.length === 0) {
    return (
      <div className="screen">
        <h1 className="app-title">Sleep Lab</h1>
        <div className="empty-state">
          <p>Enter your last 7 nights to establish your baseline.</p>
          <button className="primary-btn" onClick={() => navigate('log')}>Log last night</button>
        </div>
      </div>
    )
  }

  const lastNight = nights[0]
  const baseline = calcBaseline(nights, days)

  return (
    <div className="screen">
      <h1 className="app-title">Sleep Lab</h1>

      <div className="card">
        <div className="card-header">
          <span className="card-label">Last Night</span>
          <span className="card-date">{fmtDate(lastNight.Date)}</span>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="metric-label">Total</span>
            <span className="metric-value">{fmtMinutes(lastNight['Total Sleep'])}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Deep</span>
            <span className="metric-value">{fmtMinutes(lastNight['Deep Sleep'])}</span>
          </div>
          <div className="metric">
            <span className="metric-label">REM</span>
            <span className="metric-value">{fmtMinutes(lastNight['REM Sleep'])}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Battery</span>
            <span className="metric-value">{fmtBattery(lastNight['Body Battery Change'])}</span>
          </div>
        </div>
        {lastNight.Tactics?.length > 0 && (
          <p className="card-tactics">{lastNight.Tactics.join(', ')}</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-label">Baseline</span>
          <div className="toggle-group">
            {[7, 30, 365].map(d => (
              <button
                key={d}
                className={`toggle-btn${days === d ? ' active' : ''}`}
                onClick={() => setDays(d)}
              >{d}d</button>
            ))}
          </div>
        </div>
        {baseline ? (
          <>
            <div className="metrics">
              <div className="metric">
                <span className="metric-label">Total</span>
                <span className="metric-value">{fmtMinutes(baseline.totalSleep)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Deep</span>
                <span className="metric-value">{fmtMinutes(baseline.deepSleep)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">REM</span>
                <span className="metric-value">{fmtMinutes(baseline.remSleep)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Battery</span>
                <span className="metric-value">{fmtBattery(baseline.bodyBattery)}</span>
              </div>
            </div>
            <p className="card-footer">{baseline.count} tactic-free night{baseline.count !== 1 ? 's' : ''}</p>
          </>
        ) : (
          <p className="card-empty">Not enough baseline data in this window</p>
        )}
      </div>

      <button className="fab" onClick={() => navigate('log')}>+ Log</button>
    </div>
  )
}
