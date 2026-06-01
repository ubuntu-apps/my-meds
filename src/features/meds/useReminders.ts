import { useCallback, useEffect, useState } from 'react'
import type { AppData } from './types'
import { buildDaySlots, dateKey, formatTime, REMINDER_LEAD_MINUTES, slotId } from './schedule'

const NOTIFIED_KEY = 'my-meds:notified:v1'
const TICK_MS = 30_000
/** How long after the reminder moment we still allow firing (covers a closed/asleep tab). */
const REMINDER_WINDOW_MS = 10 * 60_000

type NotifiedState = { date: string; ids: string[] }

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

async function showReminder(title: string, body: string): Promise<void> {
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
          void showReminder(
            `${slot.medication.name} in ${REMINDER_LEAD_MINUTES} min`,
            `Take at ${formatTime(slot.time)}${dose}.`,
          )
          notified.add(id)
          changed = true
        }
      }

      if (changed) saveNotified(today, notified)
    }

    check()
    const interval = window.setInterval(check, TICK_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [data, permission])

  return { permission, requestPermission }
}
