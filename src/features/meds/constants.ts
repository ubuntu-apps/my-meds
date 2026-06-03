import type { ReminderAlert, ScheduleKind, SlotStatus } from './types'

export const NOTIFIED_KEY = 'my-meds:notified:v1'
export const SNOOZE_KEY = 'my-meds:snooze:v1'

export const HISTORY_FILTER_ALL = '__all__'

export const STATUS_LABEL: Record<SlotStatus, string> = {
  upcoming: 'Upcoming',
  due: 'Due now',
  taken: 'Taken',
  skipped: 'Skipped',
  missed: 'Missed',
}

export const SCHEDULE_OPTIONS: { value: ScheduleKind; label: string }[] = [
  { value: 'fixed', label: 'Set times' },
  { value: 'interval', label: 'Every X hours' },
  { value: 'asNeeded', label: 'As needed' },
]

export const REMINDER_ALERT_OPTIONS: { value: ReminderAlert; label: string }[] = [
  { value: 'speech', label: 'Speech' },
  { value: 'sound', label: 'Sound' },
]

export const REMINDER_ALERT_HINT: Record<ReminderAlert, string> = {
  speech: 'Speaks the medication name and time when a reminder fires.',
  sound: 'Plays a short chime when a reminder fires.',
}
