import type { AppData, Medication, ReminderAlert, ScheduleKind } from './types'

const STORAGE_KEY = 'my-meds:data:v1'

export const emptyData: AppData = {
  medications: [],
  records: {},
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData
    const parsed = JSON.parse(raw) as Partial<AppData>
    const validKinds: ScheduleKind[] = ['fixed', 'interval', 'asNeeded']
    const validAlerts: ReminderAlert[] = ['speech', 'sound']
    const medications = Array.isArray(parsed.medications)
      ? (parsed.medications as Partial<Medication>[]).map((m) => ({
          ...m,
          // Backfill the day-of-week field for meds saved before that feature.
          days: Array.isArray(m.days) ? m.days : [],
          // Backfill the schedule kind for meds saved before interval/as-needed support.
          scheduleKind: validKinds.includes(m.scheduleKind as ScheduleKind)
            ? (m.scheduleKind as ScheduleKind)
            : 'fixed',
          reminderAlert: validAlerts.includes(m.reminderAlert as ReminderAlert)
            ? (m.reminderAlert as ReminderAlert)
            : 'speech',
        })) as Medication[]
      : []
    return {
      medications,
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
    }
  } catch {
    return emptyData
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage may be unavailable (private mode / quota). Failing silently keeps the UI usable.
  }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
