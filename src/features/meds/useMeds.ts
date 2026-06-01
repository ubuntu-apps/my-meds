import { useCallback, useEffect, useState } from 'react'
import type { AppData, DoseStatus, Medication } from './types'
import { createId, loadData, saveData } from './storage'
import { normalizeTimes, slotId } from './schedule'

export interface MedicationInput {
  name: string
  dosage: string
  notes: string
  times: string[]
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
      times: normalizeTimes(input.times),
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
              times: normalizeTimes(input.times),
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

  return {
    data,
    addMedication,
    updateMedication,
    setActive,
    deleteMedication,
    recordDose,
    clearDose,
  }
}

export type UseMeds = ReturnType<typeof useMeds>
