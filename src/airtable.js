const TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const TABLE = 'Nights'
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

async function fetchPage(offset) {
  const params = new URLSearchParams({
    'sort[0][field]': 'Date',
    'sort[0][direction]': 'desc',
    pageSize: '100',
  })
  if (offset) params.set('offset', offset)
  const res = await fetch(`${BASE_URL}?${params}`, { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = body?.error?.message || body?.error?.type || ''
    throw new Error(`Airtable error ${res.status}${detail ? ': ' + detail : ''}`)
  }
  return res.json()
}

export async function fetchNights() {
  const records = []
  let offset
  do {
    const data = await fetchPage(offset)
    records.push(...data.records.map(r => ({ id: r.id, ...r.fields })))
    offset = data.offset
  } while (offset)
  return records
}

export async function saveNight(fields) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = body?.error?.message || body?.error?.type || ''
    throw new Error(`Airtable error ${res.status}${detail ? ': ' + detail : ''}`)
  }
  return res.json()
}
