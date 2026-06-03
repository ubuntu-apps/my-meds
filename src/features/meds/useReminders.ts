import { useCallback, useEffect, useState } from 'react'
import type { AppData, DoseSlot, ReminderAlert } from './types'
import { buildDaySlots, dateKey, formatTime, REMINDER_LEAD_MINUTES, slotId } from './schedule'
import { triggerReminderAlert } from './reminderAlert'

const NOTIFIED_KEY = 'my-meds:notified:v1'
const SNOOZE_KEY = 'my-meds:snooze:v1'
const TICK_MS = 30_000
/** How long after the reminder moment we still allow firing (covers a closed/asleep tab). */
const REMINDER_WINDOW_MS = 10 * 60_000
/** Default minutes to delay a dose when the user snoozes its reminder. */
export const SNOOZE_MINUTES = 15

type NotifiedState = { date: string; ids: string[] }

interface SnoozeEntry {
  /** slotId of the snoozed dose. */
  id: string
  /** Epoch ms when the snoozed reminder should fire. */
  remindAt: number
  title: string
  body: string
  alert: ReminderAlert
  name: string
  time: string
}

function loadSnoozes(): SnoozeEntry[] {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SnoozeEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSnoozes(entries: SnoozeEntry[]): void {
  try {
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(entries))
  } catch {
    // ignore storage failures
  }
}

function loadNotified(today: string): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as NotifiedState
    if (parsed.date !== today) return new Set()
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function saveNotified(today: string, ids: Set<string>): void {
  try {
    const state: NotifiedState = { date: today, ids: [...ids] }
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(state))
  } catch {
    // ignore storage failures
  }
}

export type PermissionState = NotificationPermission | 'unsupported'

function currentPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

async function showReminder(
  title: string,
  body: string,
  alert: ReminderAlert,
  name: string,
  time: string,
): Promise<void> {
  triggerReminderAlert(alert, name, time)
  // Prefer the service worker registration so notifications behave correctly
  // on mobile / when the app is installed; fall back to a page notification.
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/my-meds/icons/meds-192.png',
          badge: '/my-meds/icons/meds-192.png',
          tag: title + body,
        })
        return
      }
    }
  } catch {
    // fall through to the basic notification
  }
  new Notification(title, { body })
}

export function useReminders(data: AppData) {
  const [permission, setPermission] = useState<PermissionState>(() => currentPermission())

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  const snooze = useCallback((slot: DoseSlot, minutes: number = SNOOZE_MINUTES) => {
    const id = slotId(slot.medication.id, slot.date, slot.time)
    const dose = slot.medication.dosage ? ` (${slot.medication.dosage})` : ''
    const timeLabel = formatTime(slot.time)
    const entry: SnoozeEntry = {
      id,
      remindAt: Date.now() + minutes * 60_000,
      title: `${slot.medication.name} reminder`,
      body: `Snoozed — take${dose} when you can.`,
      alert: slot.medication.reminderAlert,
      name: slot.medication.name,
      time: timeLabel,
    }
    const entries = loadSnoozes().filter((e) => e.id !== id)
    entries.push(entry)
    saveSnoozes(entries)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    let cancelled = false

    const check = () => {
      if (cancelled) return
      const now = new Date()
      const today = dateKey(now)
      const notified = loadNotified(today)
      const slots = buildDaySlots(data, now, now)
      let changed = false

      for (const slot of slots) {
        if (slot.status !== 'upcoming') continue // already taken/skipped/past
        const id = slotId(slot.medication.id, slot.date, slot.time)
        if (notified.has(id)) continue
        const sinceReminder = now.getTime() - slot.reminderAt.getTime()
        if (sinceReminder >= 0 && sinceReminder <= REMINDER_WINDOW_MS) {
          const dose = slot.medication.dosage ? ` (${slot.medication.dosage})` : ''
          const timeLabel = formatTime(slot.time)
          void showReminder(
            `${slot.medication.name} in ${REMINDER_LEAD_MINUTES} min`,
            `Take at ${timeLabel}${dose}.`,
            slot.medication.reminderAlert,
            slot.medication.name,
            timeLabel,
          )
          notified.add(id)
          changed = true
        }
      }

      if (changed) saveNotified(today, notified)

      // Fire any snoozed reminders whose delay has elapsed.
      const snoozes = loadSnoozes()
      if (snoozes.length > 0) {
        const remaining: SnoozeEntry[] = []
        let snoozeChanged = false
        for (const entry of snoozes) {
          // Drop silently if the dose was taken/skipped while snoozed.
          if (data.records[entry.id]) {
            snoozeChanged = true
            continue
          }
          if (now.getTime() >= entry.remindAt) {
            const alert = entry.alert ?? 'speech'
            const name = entry.name ?? entry.title.replace(/ reminder$/i, '')
            const time = entry.time ?? ''
            void showReminder(entry.title, entry.body, alert, name, time)
            snoozeChanged = true
          } else {
            remaining.push(entry)
          }
        }
        if (snoozeChanged) saveSnoozes(remaining)
      }
    }

    check()
    const interval = window.setInterval(check, TICK_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [data, permission])

  return { permission, requestPermission, snooze }
}
