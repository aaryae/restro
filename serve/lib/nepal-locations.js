/**
 * Nepal address suggestions via `nepal-places`
 * (7 provinces · 77 districts · 753 municipalities / palikas).
 *
 * Uses official local levels (Tokha, Chandragiri, Kirtipur, …),
 * not colloquial neighborhoods (Thamel, Baneshwor).
 */
import { districts, municipalities } from 'nepal-places'

const TYPE_SUFFIX = {
  metropolitan: 'Metropolitan City',
  'sub-metropolitan': 'Sub-Metropolitan City',
  municipality: 'Municipality',
  'rural-municipality': 'Rural Municipality',
}

const districtById = new Map(districts.map((d) => [d.id, d]))

function formatMunicipalityLabel(m, district) {
  const suffix = TYPE_SUFFIX[m.type]
  const fullName =
    suffix && !m.name.toLowerCase().includes(suffix.split(' ')[0].toLowerCase())
      ? `${m.name} ${suffix}`
      : m.name

  if (!district) return fullName
  if (m.name.toLowerCase() === district.name.toLowerCase()) return fullName
  return `${fullName}, ${district.name}`
}

/** Flat labels for autocomplete. */
export const NEPAL_LOCATIONS = (() => {
  const labels = []
  const seen = new Set()

  for (const m of municipalities) {
    const district = districtById.get(m.district_id)
    const label = formatMunicipalityLabel(m, district)
    if (!seen.has(label)) {
      seen.add(label)
      labels.push(label)
    }
  }

  for (const d of districts) {
    if (!seen.has(d.name)) {
      seen.add(d.name)
      labels.push(d.name)
    }
  }

  return labels.sort((a, b) => a.localeCompare(b))
})()

export function filterNepalLocations(query, limit = 12) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
  if (!q) return NEPAL_LOCATIONS.slice(0, limit)
  const starts = []
  const contains = []
  for (const place of NEPAL_LOCATIONS) {
    const lower = place.toLowerCase()
    if (lower.startsWith(q)) starts.push(place)
    else if (lower.includes(q)) contains.push(place)
  }
  return [...starts, ...contains].slice(0, limit)
}
