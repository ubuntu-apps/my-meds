export type DoseStatus = 'taken' | 'skipped'

/**
 * How a medication is scheduled:
 * - `fixed`    — one or more explicit times of day.
 * - `interval` — repeated every N hours from a starting time.
 * - `asNeeded` — no schedule or reminders; logged ad hoc when taken.
 */
export type ScheduleKind = 'fixed' | 'interval' | 'asNeeded'

export interface Medication {
  id: string
  name: string
  dosage: string
  notes: string
  scheduleKind: ScheduleKind
  /** Fixed schedule: local times of day, formatted "HH:mm", sorted ascending. */
  times: string[]
  /**
   * Days of the week this medication is taken, using JS getDay() numbering
   * (0 = Sunday … 6 = Saturday). An empty array or all seven days means "daily".
   * Ignored for `asNeeded` medications.
   */
  days: number[]
  /** Interval schedule: hours between doses (1–24). */
  intervalHours?: number
  /** Interval schedule: time of the first dose each day, "HH:mm". */
  intervalStart?: string
  active: boolean
  createdAt: number
}

export interface DoseRecord {
  /** Stable id: `${medId}|${date}|${time}`. */
  id: string
  medId: string
  /** Local calendar day, "YYYY-MM-DD". */
  date: string
  /** Scheduled time of day, "HH:mm". */
  time: string
  status: DoseStatus
  /** Epoch ms when the user confirmed or skipped the dose. */
  recordedAt: number
}

export interface AppData {
  medications: Medication[]
  records: Record<string, DoseRecord>
}

/** Status of a scheduled dose slot for a given day, derived from records + current time. */
export type SlotStatus = 'upcoming' | 'due' | 'taken' | 'skipped' | 'missed'

export interface DoseSlot {
  medication: Medication
  date: string
  time: string
  scheduledAt: Date
  reminderAt: Date
  status: SlotStatus
  record?: DoseRecord
}
