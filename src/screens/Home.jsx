import { useState, useEffect } from 'react'
import { fetchNights } from '../airtable'
import { fmtMinutes, fmtBattery, fmtDate, fmtDateShort, calcWindowBaseline, calcTacticAvg, filterExcluded } from '../utils'
import { DEFAULT_TACTICS } from '../tactics'

function Delta({ val, baselineVal, isMinutes, label = 'baseline' }) {
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

const METRIC_LABELS = {
  totalSleep: 'Total Sleep',
  deepSleep: 'Deep Sleep',
  remSleep: 'REM Sleep',
  bodyBattery: 'Body Battery',
}

export default function Home({ navigate, isUnlocked, onUnlock }) {
  const [nights, setNights] = useState(null)
  const [error, setError] = useState(null)
  const [expandedTactics, setExpandedTactics] = useState(new Set())
  const [showDialog, setShowDialog] = useState(false)

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
        <div className="home-header">
          <h1 className="app-title">🌙 Sleep Lab</h1>
          {isUnlocked
            ? <span className="unlocked-badge">✏️ Editing unlocked</span>
            : <button className="unlock-btn" onClick={() => setShowDialog(true)}>🔒 Unlock editing</button>
          }
        </div>
        <div className="empty-state">
          <p>Enter your last 7 nights to establish your baseline.</p>
          <button className="primary-btn" onClick={() => navigate('log')}>Log last night</button>
        </div>
      </div>
    )
  }

  const lastNight = nights[0]
  const analysisNights = filterExcluded(nights)
  const baseline = calcWindowBaseline(analysisNights, 30)
  const baselineNights = analysisNights.slice(0, 30).filter(n => (!n.Tactics || n.Tactics.length === 0) && n['Total Sleep'] != null && n['Total Sleep'] !== '')
  const tacticNames = [...new Set(analysisNights.slice(0, 30).flatMap(n => n.Tactics ?? []))]
  const tacticAvgs = tacticNames
    .map(name => ({ name, avg: calcTacticAvg(analysisNights, name, 30) }))
    .filter(t => t.avg !== null)
    .sort((a, b) => b.avg.count - a.avg.count)

  const lastBattery = lastNight['Body Battery Change'] != null && lastNight['Body Battery Change'] !== ''
    ? lastNight['Body Battery Change']
    : null

  return (
    <div className="screen">
      <div className="home-header">
        <h1 className="app-title">🌙 Sleep Lab</h1>
          {isUnlocked
            ? <span className="unlocked-badge">✏️ Editing unlocked</span>
            : <button className="unlock-btn" onClick={() => setShowDialog(true)}>🔒 Unlock editing</button>
          }
      </div>

      {showDialog && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <p>😬 <strong>This is Chiara's real sleep data.</strong></p>
            <p>If you enable editing, you could mess it up. You sure?</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowDialog(false)}>Never mind</button>
              <button className="modal-unlock-btn" onClick={() => { onUnlock(); setShowDialog(false) }}>Unlock editing</button>
            </div>
          </div>
        </div>
      )}

      <div className="card card-clickable" onClick={() => navigate('log', { editRecord: lastNight })}>
        <div className="card-header">
          <span className="card-label">Last Night</span>
          <div className="card-header-right">
            <span className="card-date">{fmtDate(lastNight.Date)}</span>
          </div>
        </div>
        <div className="metrics">
          <div className="metric">
            <span className="metric-label">Total</span>
            <span className="metric-value">{fmtMinutes(lastNight['Total Sleep'])}</span>
            <Delta val={lastNight['Total Sleep']} baselineVal={baseline?.totalSleep} isMinutes label="baseline" />
          </div>
          <div className="metric">
            <span className="metric-label">Deep</span>
            <span className="metric-value">{fmtMinutes(lastNight['Deep Sleep'])}</span>
            <Delta val={lastNight['Deep Sleep']} baselineVal={baseline?.deepSleep} isMinutes label="baseline" />
          </div>
          <div className="metric">
            <span className="metric-label">REM</span>
            <span className="metric-value">{fmtMinutes(lastNight['REM Sleep'])}</span>
            <Delta val={lastNight['REM Sleep']} baselineVal={baseline?.remSleep} isMinutes label="baseline" />
          </div>
          <div className="metric">
            <span className="metric-label">Battery</span>
            <span className="metric-value">{fmtBattery(lastNight['Body Battery Change'])}</span>
            <Delta val={lastBattery} baselineVal={baseline?.bodyBattery} isMinutes={false} label="baseline" />
          </div>
        </div>
        {lastNight.Tactics?.length > 0 && (
          <p className="card-tactics">{lastNight.Tactics.join(', ')}</p>
        )}
        {lastNight.Excluded && (
          <p className="card-excluded">
            Excluded from analysis
            {lastNight.Confounders?.length > 0 && ` · ${lastNight.Confounders.join(', ')}`}
          </p>
        )}
        {lastNight.Notes && <p className="night-note">{lastNight.Notes}</p>}
      </div>

      {tacticAvgs.map(({ name, avg }) => {
        const tacticInfo = DEFAULT_TACTICS.find(t => t.name === name)
        const expanded = expandedTactics.has(name)
        const toggleExpand = () => setExpandedTactics(prev => {
          const next = new Set(prev)
          expanded ? next.delete(name) : next.add(name)
          return next
        })
        return (
          <div key={name} className="card">
            <div className="card-header">
              <div className="card-label-group">
                <span className="card-label">{name}</span>
              </div>
              <span className="card-subtitle">{avg.count === 1 ? '1 night so far' : `${avg.count} nights so far`}</span>
            </div>
            <div className="metrics">
              <div className="metric">
                <span className="metric-label">Total</span>
                <span className="metric-value">{fmtMinutes(avg.totalSleep)}</span>
                <Delta val={avg.totalSleep} baselineVal={baseline?.totalSleep} isMinutes label="baseline" />
              </div>
              <div className="metric">
                <span className="metric-label">Deep</span>
                <span className="metric-value">{fmtMinutes(avg.deepSleep)}</span>
                <Delta val={avg.deepSleep} baselineVal={baseline?.deepSleep} isMinutes label="baseline" />
              </div>
              <div className="metric">
                <span className="metric-label">REM</span>
                <span className="metric-value">{fmtMinutes(avg.remSleep)}</span>
                <Delta val={avg.remSleep} baselineVal={baseline?.remSleep} isMinutes label="baseline" />
              </div>
              <div className="metric">
                <span className="metric-label">Battery</span>
                <span className="metric-value">{fmtBattery(avg.bodyBattery)}</span>
                <Delta val={avg.bodyBattery} baselineVal={baseline?.bodyBattery} isMinutes={false} label="baseline" />
              </div>
            </div>
            <div className="nights-list">
              <div className="nights-header">
                <span></span>
                <span>Total</span>
                <span>Deep</span>
                <span>REM</span>
                <span>Bat</span>
              </div>
              {avg.nights.map(n => (
                <div key={n.Date} className="night-row night-row-clickable" onClick={() => navigate('log', { editRecord: n })}>
                  <div className="night-row-main">
                    <span className="night-date">{fmtDateShort(n.Date)}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Total Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Deep Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['REM Sleep'])}</span>
                    <span className="night-metric-val">{fmtBattery(n['Body Battery Change'])}</span>
                  </div>
                  {n.Notes && <p className="night-note">{n.Notes}</p>}
                </div>
              ))}
            </div>
            {tacticInfo && expanded && (
              <div className="card-blurb-block">
                <p className="card-blurb">{tacticInfo.blurb}</p>
                {tacticInfo.targetMetrics?.length > 0 && (
                  <div className="expect-metrics">
                    <span className="expect-metrics-label">Targets</span>
                    <div className="expect-metrics-chips">
                      {tacticInfo.targetMetrics.map(k => (
                        <span key={k} className="expect-metric-chip">{METRIC_LABELS[k]}</span>
                      ))}
                    </div>
                  </div>
                )}
                {tacticInfo.expectTimeline && (
                  <p className="card-blurb-timeline">{tacticInfo.expectTimeline}</p>
                )}
              </div>
            )}
            {tacticInfo && (
              <button className="blurb-toggle" onClick={toggleExpand} aria-expanded={expanded}>
                {expanded ? 'Hide' : 'What to expect'}
              </button>
            )}
          </div>
        )
      })}

      <div className="card">
        <div className="card-header">
          <div className="card-label-group">
            <span className="card-label">Baseline</span>
            <span className="card-subtitle">no tactics · {baselineNights.length} {baselineNights.length === 1 ? 'night' : 'nights'} · last 30</span>
          </div>
        </div>
        {baselineNights.length === 0 ? (
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
              {baselineNights.map(n => (
                <div key={n.Date} className="night-row night-row-clickable" onClick={() => navigate('log', { editRecord: n })}>
                  <div className="night-row-main">
                    <span className="night-date">{fmtDateShort(n.Date)}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Total Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['Deep Sleep'])}</span>
                    <span className="night-metric-val">{fmtMinutes(n['REM Sleep'])}</span>
                    <span className="night-metric-val">{fmtBattery(n['Body Battery Change'])}</span>
                  </div>
                  {n.Notes && <p className="night-note">{n.Notes}</p>}
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
