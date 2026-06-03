import { useState } from 'react'
import type { Medication, ReminderAlert, ScheduleKind } from './types'
import type { MedicationInput } from './useMeds'
import { DEFAULT_INTERVAL_HOURS, DEFAULT_INTERVAL_START, formatTime, isDaily } from './schedule'
import { validateMedForm } from './validateMedForm'

export function useMedFormState(initial?: Medication) {
  const [name, setName] = useState(initial?.name ?? '')
  const [dosage, setDosage] = useState(initial?.dosage ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>(initial?.scheduleKind ?? 'fixed')
  const [times, setTimes] = useState<string[]>(initial?.times.length ? initial.times : ['08:00'])
  const [intervalHours, setIntervalHours] = useState(initial?.intervalHours ?? DEFAULT_INTERVAL_HOURS)
  const [intervalStart, setIntervalStart] = useState(initial?.intervalStart ?? DEFAULT_INTERVAL_START)
  const [daily, setDaily] = useState(isDaily(initial?.days))
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initial && !isDaily(initial.days) ? initial.days : [],
  )
  const [reminderAlert, setReminderAlert] = useState<ReminderAlert>(initial?.reminderAlert ?? 'speech')
  const [error, setError] = useState('')

  const toggleDay = (value: number) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    )
  }

  const updateTime = (index: number, value: string) => {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  const addTime = () => setTimes((prev) => [...prev, '12:00'])
  const removeTime = (index: number) =>
    setTimes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))

  const testReminderTime = (): string => {
    if (scheduleKind === 'interval') return formatTime(intervalStart)
    const first = times.find(Boolean)
    return first ? formatTime(first) : '8:00 AM'
  }

  const buildInput = (): MedicationInput | null => {
    const validationError = validateMedForm({
      name,
      scheduleKind,
      times,
      daily,
      selectedDays,
      intervalHours,
    })
    if (validationError) {
      setError(validationError)
      return null
    }
    setError('')
    return {
      name,
      dosage,
      notes,
      scheduleKind,
      times: times.filter(Boolean),
      days: daily ? [] : selectedDays,
      intervalHours,
      intervalStart,
      reminderAlert: scheduleKind === 'asNeeded' ? undefined : reminderAlert,
    }
  }

  return {
    name,
    setName,
    dosage,
    setDosage,
    notes,
    setNotes,
    scheduleKind,
    setScheduleKind,
    times,
    intervalHours,
    setIntervalHours,
    intervalStart,
    setIntervalStart,
    daily,
    setDaily,
    selectedDays,
    toggleDay,
    updateTime,
    addTime,
    removeTime,
    reminderAlert,
    setReminderAlert,
    error,
    testReminderTime,
    buildInput,
    isEdit: Boolean(initial),
  }
}
