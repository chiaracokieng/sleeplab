import { describe, it, expect } from 'vitest'
import { fmtMinutes, fmtBattery, calcBaseline, calcTacticAvg, calcWindowBaseline } from '../utils'

describe('fmtMinutes', () => {
  it('formats whole hours', () => {
    expect(fmtMinutes(480)).toBe('8h 0m')
  })

  it('formats hours and minutes', () => {
    expect(fmtMinutes(457)).toBe('7h 37m')
  })

  it('formats sub-hour values', () => {
    expect(fmtMinutes(45)).toBe('0h 45m')
  })

  it('returns em-dash for null', () => {
    expect(fmtMinutes(null)).toBe('—')
  })

  it('returns em-dash for empty string', () => {
    expect(fmtMinutes('')).toBe('—')
  })
})

describe('fmtBattery', () => {
  it('prefixes positive values with +', () => {
    expect(fmtBattery(12)).toBe('+12')
  })

  it('formats zero as +0', () => {
    expect(fmtBattery(0)).toBe('+0')
  })

  it('preserves sign on negative values', () => {
    expect(fmtBattery(-5)).toBe('-5')
  })

  it('returns em-dash for null', () => {
    expect(fmtBattery(null)).toBe('—')
  })

  it('returns em-dash for empty string', () => {
    expect(fmtBattery('')).toBe('—')
  })
})

describe('calcTacticAvg', () => {
  const night = (overrides = {}) => ({
    'Total Sleep': 420,
    'Deep Sleep': 90,
    'REM Sleep': 100,
    'Body Battery Change': 10,
    Tactics: [],
    ...overrides,
  })

  it('returns null when no nights have the tactic', () => {
    const nights = [night(), night()]
    expect(calcTacticAvg(nights, 'Mouth tape', 30)).toBeNull()
  })

  it('returns correct average for a tactic', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 400 }),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 440 }),
      night({ Tactics: [] }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 30)
    expect(result.totalSleep).toBe(420)
  })

  it('includes nights[0] (no slice(1) offset)', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 300 }),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 500 }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 30)
    expect(result.totalSleep).toBe(400)
  })

  it('excludes nights without the tactic from the average', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 400 }),
      night({ Tactics: ['Cold room'], 'Total Sleep': 999 }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 30)
    expect(result.totalSleep).toBe(400)
    expect(result.count).toBe(1)
  })

  it('excludes nights with missing metric from that metric average only', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'], 'Deep Sleep': 60, 'REM Sleep': null }),
      night({ Tactics: ['Mouth tape'], 'Deep Sleep': null, 'REM Sleep': 80 }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 30)
    expect(result.deepSleep).toBe(60)
    expect(result.remSleep).toBe(80)
  })

  it('respects sampleSize cap', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 300 }),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 400 }),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 500 }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 2)
    expect(result.count).toBe(2)
    expect(result.totalSleep).toBe(350)
  })

  it('returns correct count', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'] }),
      night({ Tactics: ['Mouth tape'] }),
      night({ Tactics: [] }),
    ]
    const result = calcTacticAvg(nights, 'Mouth tape', 30)
    expect(result.count).toBe(2)
  })
})

describe('calcWindowBaseline', () => {
  const night = (overrides = {}) => ({
    'Total Sleep': 420,
    'Deep Sleep': 90,
    'REM Sleep': 100,
    'Body Battery Change': 10,
    Tactics: [],
    ...overrides,
  })

  it('returns null when no tactic-free nights exist in window', () => {
    const nights = [night({ Tactics: ['Mouth tape'] }), night({ Tactics: ['Cold room'] })]
    expect(calcWindowBaseline(nights, 30)).toBeNull()
  })

  it('includes nights[0] (no slice(1) offset)', () => {
    const nights = [
      night({ 'Total Sleep': 300 }),
      night({ 'Total Sleep': 500 }),
    ]
    const result = calcWindowBaseline(nights, 30)
    expect(result.totalSleep).toBe(400)
  })

  it('excludes tactic nights', () => {
    const nights = [
      night({ 'Total Sleep': 400 }),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 999 }),
    ]
    const result = calcWindowBaseline(nights, 30)
    expect(result.totalSleep).toBe(400)
  })

  it('respects sampleSize cap', () => {
    const nights = [
      night({ 'Total Sleep': 300 }),
      night({ 'Total Sleep': 500 }),
      night({ 'Total Sleep': 700 }),
    ]
    const result = calcWindowBaseline(nights, 2)
    expect(result.count).toBe(2)
    expect(result.totalSleep).toBe(400)
  })
})

describe('calcBaseline', () => {
  const night = (overrides = {}) => ({
    'Total Sleep': 420,
    'Deep Sleep': 90,
    'REM Sleep': 100,
    'Body Battery Change': 10,
    Tactics: [],
    ...overrides,
  })

  it('returns null when no tactic-free nights exist (excluding last night)', () => {
    const nights = [
      night({ Tactics: ['Mouth tape'] }),
      night({ Tactics: ['Cold room'] }),
    ]
    expect(calcBaseline(nights, 30)).toBeNull()
  })

  it('excludes nights[0] (last night) from baseline', () => {
    const lastNight = night({ 'Total Sleep': 999 })
    const baselineNight = night({ 'Total Sleep': 400 })
    const result = calcBaseline([lastNight, baselineNight], 30)
    expect(result.totalSleep).toBe(400)
  })

  it('excludes nights with any tactics', () => {
    const nights = [
      night(),
      night({ Tactics: ['Mouth tape'], 'Total Sleep': 999 }),
      night({ 'Total Sleep': 300 }),
    ]
    const result = calcBaseline(nights, 30)
    expect(result.totalSleep).toBe(300)
  })

  it('respects sampleSize cap', () => {
    const nights = [
      night(),
      night({ 'Total Sleep': 300 }),
      night({ 'Total Sleep': 400 }),
      night({ 'Total Sleep': 500 }),
    ]
    const result = calcBaseline(nights, 2)
    expect(result.count).toBe(2)
    expect(result.totalSleep).toBe(350)
  })

  it('rounds averages to nearest integer', () => {
    const nights = [
      night(),
      night({ 'Total Sleep': 361 }),
      night({ 'Total Sleep': 362 }),
    ]
    const result = calcBaseline(nights, 30)
    expect(result.totalSleep).toBe(362)
  })

  it('handles missing fields gracefully — returns null for that metric', () => {
    const nights = [
      night(),
      night({ 'Deep Sleep': null }),
      night({ 'Deep Sleep': null }),
    ]
    const result = calcBaseline(nights, 30)
    expect(result.deepSleep).toBeNull()
  })

  it('averages only nights that have a value for each metric independently', () => {
    const nights = [
      night(),
      night({ 'Deep Sleep': 60, 'REM Sleep': null }),
      night({ 'Deep Sleep': null, 'REM Sleep': 80 }),
    ]
    const result = calcBaseline(nights, 30)
    expect(result.deepSleep).toBe(60)
    expect(result.remSleep).toBe(80)
  })

  it('returns correct count', () => {
    const nights = [night(), night(), night(), night()]
    const result = calcBaseline(nights, 30)
    expect(result.count).toBe(3)
  })
})
