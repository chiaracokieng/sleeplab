import { useState } from 'react'
import { saveNight } from '../airtable'
import { TACTIC_NAMES } from '../tactics'

const CUSTOM_KEY = 'sleeplab_custom_tactics'

function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadCustomTactics() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]')
  } catch {
    return []
  }
}

export default function Log({ navigate }) {
  const [form, setForm] = useState({
    date: localToday(),
    totalSleepH: '',
    totalSleepM: '',
    deepSleepH: '',
    deepSleepM: '',
    remSleepH: '',
    remSleepM: '',
    bodyBattery: '',
    tactics: [],
    notes: '',
  })
  const [customTactics, setCustomTactics] = useState(loadCustomTactics)
  const [newTactic, setNewTactic] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const allTactics = [...TACTIC_NAMES, ...customTactics]

  function toggleTactic(t) {
    setForm(f => ({
      ...f,
      tactics: f.tactics.includes(t)
        ? f.tactics.filter(x => x !== t)
        : [...f.tactics, t],
    }))
  }

  function addCustomTactic() {
    const t = newTactic.trim()
    if (!t || allTactics.includes(t)) return
    const updated = [...customTactics, t]
    setCustomTactics(updated)
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated))
    setNewTactic('')
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const fields = {
        Date: form.date,
        'Total Sleep': parseInt(form.totalSleepH || 0) * 60 + parseInt(form.totalSleepM || 0),
        'Deep Sleep': parseInt(form.deepSleepH || 0) * 60 + parseInt(form.deepSleepM || 0),
        'REM Sleep': parseInt(form.remSleepH || 0) * 60 + parseInt(form.remSleepM || 0),
        Tactics: form.tactics,
      }
      if (form.bodyBattery !== '') fields['Body Battery Change'] = parseInt(form.bodyBattery)
      if (form.notes.trim()) fields.Notes = form.notes.trim()
      await saveNight(fields)
      navigate('home')
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('home')}>← Back</button>
        <h1 className="app-title">Log Last Night</h1>
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        />
      </div>

      {[
        ['Total Sleep', 'totalSleepH', 'totalSleepM'],
        ['Deep Sleep', 'deepSleepH', 'deepSleepM'],
        ['REM Sleep', 'remSleepH', 'remSleepM'],
      ].map(([label, hKey, mKey]) => (
        <div className="form-group" key={label}>
          <label>{label}</label>
          <div className="time-inputs">
            <input
              type="number"
              min="0"
              max="23"
              placeholder="0"
              value={form[hKey]}
              onChange={e => setForm(f => ({ ...f, [hKey]: e.target.value }))}
            />
            <span>h</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={form[mKey]}
              onChange={e => setForm(f => ({ ...f, [mKey]: e.target.value }))}
            />
            <span>m</span>
          </div>
        </div>
      ))}

      <div className="form-group">
        <label>Body Battery Change</label>
        <input
          type="number"
          placeholder="+56"
          value={form.bodyBattery}
          onChange={e => setForm(f => ({ ...f, bodyBattery: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Tactics</label>
        <div className="chips">
          {allTactics.map(t => (
            <button
              key={t}
              className={`chip${form.tactics.includes(t) ? ' active' : ''}`}
              onClick={() => toggleTactic(t)}
            >{t}</button>
          ))}
        </div>
        <div className="add-tactic">
          <input
            type="text"
            placeholder="Add custom tactic…"
            value={newTactic}
            onChange={e => setNewTactic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomTactic()}
          />
          <button onClick={addCustomTactic}>Add</button>
        </div>
      </div>

      <div className="form-group">
        <label>Notes <span className="optional">(optional)</span></label>
        <textarea
          placeholder="felt groggy, woke up twice…"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <button className="primary-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
