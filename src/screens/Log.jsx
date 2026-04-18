import { useState } from 'react'
import { saveNight, updateNight, deleteNight } from '../airtable'
import { TACTIC_NAMES } from '../tactics'
import { CONFOUNDER_NAMES } from '../confounders'

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

export default function Log({ navigate, editRecord }) {
  const [form, setForm] = useState(() => {
    if (!editRecord) return {
      date: localToday(),
      totalSleepH: '',
      totalSleepM: '',
      deepSleepH: '',
      deepSleepM: '',
      remSleepH: '',
      remSleepM: '',
      bodyBattery: '',
      tactics: [],
      confounders: [],
      excluded: false,
      notes: '',
    }
    return {
      date: editRecord.Date,
      totalSleepH: String(Math.floor((editRecord['Total Sleep'] ?? 0) / 60)),
      totalSleepM: String((editRecord['Total Sleep'] ?? 0) % 60),
      deepSleepH:  String(Math.floor((editRecord['Deep Sleep']  ?? 0) / 60)),
      deepSleepM:  String((editRecord['Deep Sleep']  ?? 0) % 60),
      remSleepH:   String(Math.floor((editRecord['REM Sleep']   ?? 0) / 60)),
      remSleepM:   String((editRecord['REM Sleep']   ?? 0) % 60),
      bodyBattery: editRecord['Body Battery Change'] ?? '',
      tactics:     editRecord.Tactics ?? [],
      confounders: editRecord.Confounders ?? [],
      excluded:    editRecord.Excluded ?? false,
      notes:       editRecord.Notes ?? '',
    }
  })
  const [customTactics, setCustomTactics] = useState(loadCustomTactics)
  const [newTactic, setNewTactic] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const allTactics = [...TACTIC_NAMES, ...customTactics]

  function toggleTactic(t) {
    setForm(f => ({
      ...f,
      tactics: f.tactics.includes(t)
        ? f.tactics.filter(x => x !== t)
        : [...f.tactics, t],
    }))
  }

  function toggleConfounder(c) {
    setForm(f => {
      const confounders = f.confounders.includes(c)
        ? f.confounders.filter(x => x !== c)
        : [...f.confounders, c]
      return {
        ...f,
        confounders,
        excluded: confounders.length > 0 ? f.excluded : false,
      }
    })
  }

  function addCustomTactic() {
    const t = newTactic.trim()
    if (!t || allTactics.includes(t)) return
    const updated = [...customTactics, t]
    setCustomTactics(updated)
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated))
    setNewTactic('')
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteNight(editRecord.id)
      navigate('home')
    } catch (e) {
      setError(e.message)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const effectiveExcluded = form.confounders.length > 0 || form.excluded
      const fields = {
        Date: form.date,
        'Total Sleep': parseInt(form.totalSleepH || 0) * 60 + parseInt(form.totalSleepM || 0),
        'Deep Sleep': parseInt(form.deepSleepH || 0) * 60 + parseInt(form.deepSleepM || 0),
        'REM Sleep': parseInt(form.remSleepH || 0) * 60 + parseInt(form.remSleepM || 0),
        Tactics: form.tactics,
        Excluded: effectiveExcluded,
      }
      fields.Confounders = form.confounders
      if (form.bodyBattery !== '') fields['Body Battery Change'] = parseInt(form.bodyBattery)
      if (form.notes.trim()) fields.Notes = form.notes.trim()
      if (editRecord) {
        await updateNight(editRecord.id, fields)
      } else {
        await saveNight(fields)
      }
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
        <h1 className="app-title">{editRecord ? 'Edit Night' : 'Log Last Night'}</h1>
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
        <label>Unusual circumstances <span className="optional">(optional)</span></label>
        <div className="chips">
          {CONFOUNDER_NAMES.map(c => (
            <button
              key={c}
              className={`chip${form.confounders.includes(c) ? ' active' : ''}`}
              onClick={() => toggleConfounder(c)}
            >{c}</button>
          ))}
        </div>
        {form.confounders.length === 0 && (
          <label className="excluded-checkbox">
            <input
              type="checkbox"
              checked={form.excluded}
              onChange={e => setForm(f => ({ ...f, excluded: e.target.checked }))}
            />
            <span>Exclude from experiments</span>
          </label>
        )}
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

      <button className="primary-btn" onClick={handleSave} disabled={saving || deleting}>
        {saving ? (editRecord ? 'Updating…' : 'Saving…') : (editRecord ? 'Update' : 'Save')}
      </button>

      {editRecord && (
        confirmDelete ? (
          <div className="delete-confirm">
            <span>Delete this night permanently?</span>
            <button className="delete-confirm-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button className="delete-cancel-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="delete-btn" onClick={() => setConfirmDelete(true)}>
            Delete night
          </button>
        )
      )}
    </div>
  )
}
