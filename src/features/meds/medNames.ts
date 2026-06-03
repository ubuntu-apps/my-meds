import type { AppData } from './types'

/** Map medication id → display name, including removed meds from history. */
export function buildMedicationNameMap(data: AppData): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of data.medications) map.set(m.id, m.name)
  for (const r of Object.values(data.records)) {
    if (!map.has(r.medId)) map.set(r.medId, 'Removed medication')
  }
  return map
}
