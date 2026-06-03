import type { DoseSlot, ReminderAlert } from './types'
import { formatDosageSuffix } from './formatters'
import { formatTime, REMINDER_LEAD_MINUTES } from './schedule'

export interface ReminderCopy {
  title: string
  body: string
  alert: ReminderAlert
  name: string
  time: string
}

export function buildLeadReminder(slot: DoseSlot): ReminderCopy {
  const timeLabel = formatTime(slot.time)
  return {
    title: `${slot.medication.name} in ${REMINDER_LEAD_MINUTES} min`,
    body: `Take at ${timeLabel}${formatDosageSuffix(slot.medication.dosage)}.`,
    alert: slot.medication.reminderAlert,
    name: slot.medication.name,
    time: timeLabel,
  }
}

export function buildSnoozeReminder(slot: DoseSlot): Omit<ReminderCopy, 'time'> & { time: string } {
  const timeLabel = formatTime(slot.time)
  return {
    title: `${slot.medication.name} reminder`,
    body: `Snoozed — take${formatDosageSuffix(slot.medication.dosage)} when you can.`,
    alert: slot.medication.reminderAlert,
    name: slot.medication.name,
    time: timeLabel,
  }
}
