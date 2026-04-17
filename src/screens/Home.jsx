import { useState, useEffect } from 'react'
import { fetchNights } from '../airtable'
import { fmtMinutes, fmtBattery, fmtDate, fmtDateShort, calcBaseline } from '../utils'

function Delta({ val, baselineVal, isMinutes, label = 'avg' }) {
  const hasVal = val != null && val !== ''
  const hasBaseline = baselineVal != null
  if (!hasVal || !hasBaseline) {
    return <span className="metric-delta">—</span>
  }
  const diff = val - baselineVal
  const positive = diff >= 0
  let diffStr
  if (isMinutes) {
    const absDiff = Math.abs(diff)
    const h = Math.floor(absDiff / 60)
    const m = absDiff % 60
    diffStr = h > 0 ? `${h}h ${m}m` : `${m}m`
    diffStr = positive ? `+${diffStr}` : `-${diffStr}`
  } else {
    diffStr = positive ? `+${diff}` : `${diff}`
  }
  return (
    <span className={`metric-delta ${positive ? 'delta-up' : 'delta-down'}`}>
      {diffStr} vs {label}
    </span>
  )
}

export default function Home({ navigate }) {
  const [nights, setNights] = useState(null)
  const [error, setError] = useState(null)
  const [sampleSize, setSampleSize] = useState(30)

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
  const baseline = calcBaseline(nights, sampleSize)
  const tacticFreeNights = nights.slice(1, sampleSize + 1)
    .filter(n => !n.Tactics || n.Tactics.length === 0)

  const lastBattery = lastNight['Body Battery Change'] != null && lastNight['Body Battery Change'] !== ''
    ? lastNight['Body Battery Change']
    : null

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
            <Delta val={lastNight['Total Sleep']} baselineVal={baseline?.totalSleep} isMinutes />
          </div>
          <div className="metric">
            <span className="metric-label">Deep</span>
            <span className="metric-value">{fmtMinutes(lastNight['Deep Sleep'])}</span>
            <Delta val={lastNight['Deep Sleep']} baselineVal={baseline?.deepSleep} isMinutes />
          </div>
          <div className="metric">
            <span className="metric-label">REM</span>
            <span className="metric-value">{fmtMinutes(lastNight['REM Sleep'])}</span>
            <Delta val={lastNight['REM Sleep']} baselineVal={baseline?.remSleep} isMinutes />
          </div>
          <div className="metric">
            <span className="metric-label">Battery</span>
            <span className="metric-value">{fmtBattery(lastNight['Body Battery Change'])}</span>
            <Delta val={lastBattery} baselineVal={baseline?.bodyBattery} isMinutes={false} />
          </div>
        </div>
        {lastNight.Tactics?.length > 0 && (
          <p className="card-tactics">{lastNight.Tactics.join(', ')}</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-label-group">
            <span className="card-label">Baseline</span>
            <span className="card-subtitle">tactic-free nights</span>
          </div>
          <div className="toggle-group">
            {[7, 30, 90].map(n => (
              <button
                key={n}
                className={`toggle-btn${sampleSize === n ? ' active' : ''}`}
                onClick={() => setSampleSize(n)}
              >{n}</button>
            ))}
          </div>
        </div>
        {tacticFreeNights.length === 0 ? (
          <p className="card-empty">No tactic-free nights yet</p>
        ) : (
          <>
            <div className="nights-avg">
              <span className="night-date avg-label">Avg</span>
              <span className="night-metric-val">{fmtMinutes(baseline?.totalSleep)}</span>
              <span className="night-metric-val">{fmtMinutes(baseline?.deepSleep)}</span>
              <span className="night-metric-val">{fmtMinutes(baseline?.remSleep)}</span>
              <span className="night-metric-val">{fmtBattery(baseline?.bodyBattery)}</span>
            </div>
            <div className="nights-list">
              <div className="nights-header">
                <span></span>
                <span>Total</span>
                <span>Deep</span>
                <span>REM</span>
                <span>Bat</span>
              </div>
              {tacticFreeNights.map(n => (
                <div key={n.Date} className="night-row">
                  <div className="night-row-main">
                    <span className="night-date">{fmtDateShort(n.Date)}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Total Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Deep Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['REM Sleep'])}</span>
                    <span className="night-metric-val">{fmtBattery(n['Body Battery Change'])}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <button className="fab" onClick={() => navigate('log')}>+ Log</button>
    </div>
  )
}
