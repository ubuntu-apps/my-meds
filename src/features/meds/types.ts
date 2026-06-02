export type DoseStatus = 'taken' | 'skipped'

export interface Medication {
  id: string
  name: string
  dosage: string
  notes: string
  /** Local times of day this medication is taken, formatted "HH:mm", sorted ascending. */
  times: string[]
  /**
   * Days of the week this medication is taken, using JS getDay() numbering
   * (0 = Sunday … 6 = Saturday). An empty array or all seven days means "daily".
   */
  days: number[]
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
