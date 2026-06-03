import type { ScheduleKind } from './types'

export interface MedFormValues {
  name: string
  scheduleKind: ScheduleKind
  times: string[]
  daily: boolean
  selectedDays: number[]
  intervalHours: number
}

export function validateMedForm(values: MedFormValues): string | null {
  if (!values.name.trim()) return 'Please enter a medication name.'

  const cleanTimes = values.times.filter(Boolean)
  const needsDays = values.scheduleKind !== 'asNeeded' && !values.daily && values.selectedDays.length === 0

  if (values.scheduleKind === 'fixed') {
    if (cleanTimes.length === 0) return 'Add at least one time of day.'
    if (needsDays) return 'Pick at least one day, or choose Daily.'
  } else if (values.scheduleKind === 'interval') {
    if (!Number.isFinite(values.intervalHours) || values.intervalHours < 1 || values.intervalHours > 24) {
      return 'Enter an interval between 1 and 24 hours.'
    }
    if (needsDays) return 'Pick at least one day, or choose Daily.'
  }

  return null
}
