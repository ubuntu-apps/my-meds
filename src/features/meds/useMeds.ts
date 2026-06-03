import { useCallback, useEffect, useState } from 'react'
import type { AppData, DoseRecord, DoseSlot, DoseStatus, Medication, ReminderAlert, ScheduleKind } from './types'
import { createId, loadData, saveData } from './storage'
import { dateKey, normalizeDays, normalizeIntervalHours, normalizeTimes, slotId } from './schedule'

export interface MedicationInput {
  name: string
  dosage: string
  notes: string
  scheduleKind: ScheduleKind
  times: string[]
  days: number[]
  intervalHours?: number
  intervalStart?: string
  reminderAlert?: ReminderAlert
}

function buildSchedule(input: MedicationInput): Pick<
  Medication,
  'scheduleKind' | 'times' | 'days' | 'intervalHours' | 'intervalStart'
> {
  if (input.scheduleKind === 'asNeeded') {
    return { scheduleKind: 'asNeeded', times: [], days: [] }
  }
  if (input.scheduleKind === 'interval') {
    return {
      scheduleKind: 'interval',
      times: [],
      days: normalizeDays(input.days),
      intervalHours: normalizeIntervalHours(input.intervalHours),
      intervalStart: input.intervalStart || '08:00',
    }
  }
  return {
    scheduleKind: 'fixed',
    times: normalizeTimes(input.times),
    days: normalizeDays(input.days),
  }
}

export function useMeds() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  // Keep multiple tabs / the installed app in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'my-meds:data:v1') setData(loadData())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addMedication = useCallback((input: MedicationInput) => {
    const med: Medication = {
      id: createId(),
      name: input.name.trim(),
      dosage: input.dosage.trim(),
      notes: input.notes.trim(),
      ...buildSchedule(input),
      reminderAlert: input.scheduleKind === 'asNeeded' ? 'speech' : (input.reminderAlert ?? 'speech'),
      active: true,
      createdAt: Date.now(),
    }
    setData((prev) => ({ ...prev, medications: [...prev.medications, med] }))
    return med
  }, [])

  const updateMedication = useCallback((id: string, input: MedicationInput) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === id
          ? {
              ...m,
              name: input.name.trim(),
              dosage: input.dosage.trim(),
              notes: input.notes.trim(),
              intervalHours: undefined,
              intervalStart: undefined,
              ...buildSchedule(input),
              reminderAlert:
                input.scheduleKind === 'asNeeded' ? 'speech' : (input.reminderAlert ?? m.reminderAlert),
            }
          : m,
      ),
    }))
  }, [])

  const setActive = useCallback((id: string, active: boolean) => {
    setData((prev) => ({
      ...prev,
      medications: prev.medications.map((m) => (m.id === id ? { ...m, active } : m)),
    }))
  }, [])

  const deleteMedication = useCallback((id: string) => {
    setData((prev) => {
      const records = { ...prev.records }
      for (const key of Object.keys(records)) {
        if (records[key].medId === id) delete records[key]
      }
      return {
        medications: prev.medications.filter((m) => m.id !== id),
        records,
      }
    })
  }, [])

  const recordDose = useCallback(
    (medId: string, date: string, time: string, status: DoseStatus) => {
      const id = slotId(medId, date, time)
      setData((prev) => ({
        ...prev,
        records: {
          ...prev.records,
          [id]: { id, medId, date, time, status, recordedAt: Date.now() },
        },
      }))
    },
    [],
  )

  const clearDose = useCallback((medId: string, date: string, time: string) => {
    const id = slotId(medId, date, time)
    setData((prev) => {
      if (!prev.records[id]) return prev
      const records = { ...prev.records }
      delete records[id]
      return { ...prev, records }
    })
  }, [])

  // Record an unscheduled ("as needed") dose at the current local time.
  const logAsNeeded = useCallback((medId: string) => {
    const now = new Date()
    const date = dateKey(now)
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    recordDose(medId, date, time, 'taken')
  }, [recordDose])

  const recordSlot = useCallback(
    (slot: DoseSlot, status: DoseStatus) => {
      recordDose(slot.medication.id, slot.date, slot.time, status)
    },
    [recordDose],
  )

  const clearSlot = useCallback(
    (slot: DoseSlot) => {
      clearDose(slot.medication.id, slot.date, slot.time)
    },
    [clearDose],
  )

  const takeAllSlots = useCallback(
    (slots: DoseSlot[]) => {
      slots.forEach((slot) => recordSlot(slot, 'taken'))
    },
    [recordSlot],
  )

  const clearAsNeededRecord = useCallback(
    (record: DoseRecord) => {
      clearDose(record.medId, record.date, record.time)
    },
    [clearDose],
  )

  return {
    data,
    addMedication,
    updateMedication,
    setActive,
    deleteMedication,
    recordDose,
    clearDose,
    logAsNeeded,
    recordSlot,
    clearSlot,
    takeAllSlots,
    clearAsNeededRecord,
  }
}
