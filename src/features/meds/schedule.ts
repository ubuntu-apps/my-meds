import type { AppData, DoseSlot, Medication, SlotStatus } from './types'

/** Minutes before the scheduled time that a reminder should fire. */
export const REMINDER_LEAD_MINUTES = 15

/** Weekdays ordered Monday-first for display, with short labels. */
export const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
]

/** True when a medication is taken every day (empty or all seven days). */
export function isDaily(days: number[] | undefined): boolean {
  return !days || days.length === 0 || days.length >= 7
}

/** Whether a medication is scheduled on the weekday of the given date. */
export function isActiveOnDay(days: number[] | undefined, day: Date): boolean {
  if (isDaily(days)) return true
  return days!.includes(day.getDay())
}

/** A human-friendly schedule summary, e.g. "Every day" or "Mon, Wed, Fri". */
export function formatDays(days: number[] | undefined): string {
  if (isDaily(days)) return 'Every day'
  const set = new Set(days)
  return WEEKDAYS.filter((d) => set.has(d.value))
    .map((d) => d.short)
    .join(', ')
}

/** Format a Date as a local "YYYY-MM-DD" key. */
export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Build the stable record/slot id for a medication dose. */
export function slotId(medId: string, date: string, time: string): string {
  return `${medId}|${date}|${time}`
}

/** Resolve a "YYYY-MM-DD" + "HH:mm" pair to a local Date. */
export function toDate(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

/** Human-friendly time, respecting the device locale (e.g. "8:00 AM"). */
export function formatTime(time: string): string {
  const [hh, mm] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function computeStatus(
  scheduledAt: Date,
  now: Date,
  recordStatus: SlotStatus | undefined,
  isToday: boolean,
): SlotStatus {
  if (recordStatus === 'taken' || recordStatus === 'skipped') return recordStatus
  if (now < scheduledAt) return 'upcoming'
  // Past the scheduled time with no record.
  return isToday ? 'due' : 'missed'
}

/**
 * Build the ordered list of dose slots for a single calendar day,
 * combining each active medication's scheduled times with any saved records.
 */
export function buildDaySlots(data: AppData, day: Date, now: Date = new Date()): DoseSlot[] {
  const date = dateKey(day)
  const isToday = date === dateKey(now)
  const slots: DoseSlot[] = []

  for (const med of data.medications) {
    if (!med.active) continue
    if (!isActiveOnDay(med.days, day)) continue
    for (const time of med.times) {
      const scheduledAt = toDate(date, time)
      const reminderAt = new Date(scheduledAt.getTime() - REMINDER_LEAD_MINUTES * 60_000)
      const record = data.records[slotId(med.id, date, time)]
      const status = computeStatus(scheduledAt, now, record?.status, isToday)
      slots.push({ medication: med, date, time, scheduledAt, reminderAt, status, record })
    }
  }

  return slots.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
}

/** Sort medication times ascending and drop duplicates/empties. */
export function normalizeTimes(times: string[]): string[] {
  return Array.from(new Set(times.filter(Boolean))).sort()
}

/**
 * Canonicalize selected weekdays: valid values only, de-duped and sorted.
 * "Daily" (all seven days) collapses to an empty array.
 */
export function normalizeDays(days: number[]): number[] {
  const valid = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort()
  return valid.length >= 7 ? [] : valid
}

export function sortMedications(meds: Medication[]): Medication[] {
  return [...meds].sort((a, b) => a.name.localeCompare(b.name))
}
