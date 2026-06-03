import { LocalNotifications } from '@capacitor/local-notifications'
import type { AppData, DoseSlot, ReminderAlert } from './types'
import { buildDaySlots, formatTime, REMINDER_LEAD_MINUTES, slotId } from './schedule'
import { isNativeApp } from '../../platform/native'
import { triggerReminderAlert } from './reminderAlert'

const CHANNEL_ID = 'med-reminders'
/** iOS allows a limited number of pending local notifications. */
const MAX_SCHEDULED = 50
const DAYS_AHEAD = 14
const SNOOZE_ID_OFFSET = 1_000_000_000

export type NativePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

function toNotificationId(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 2147483646) + 1
}

function snoozeNotificationId(slotKey: string): number {
  return toNotificationId(slotKey) + SNOOZE_ID_OFFSET
}

async function ensureAndroidChannel(): Promise<void> {
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Medication reminders',
    description: 'Reminders before each scheduled dose',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  })
}

function collectUpcomingNotifications(data: AppData, now: Date) {
  const items: {
    id: number
    title: string
    body: string
    at: Date
    extra: { alert: ReminderAlert; name: string; time: string }
  }[] = []

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)
    const slots = buildDaySlots(data, day, now)
    for (const slot of slots) {
      if (slot.status !== 'upcoming') continue
      if (slot.reminderAt.getTime() <= now.getTime()) continue
      const timeLabel = formatTime(slot.time)
      const dose = slot.medication.dosage ? ` (${slot.medication.dosage})` : ''
      const key = slotId(slot.medication.id, slot.date, slot.time)
      items.push({
        id: toNotificationId(key),
        title: `${slot.medication.name} in ${REMINDER_LEAD_MINUTES} min`,
        body: `Take at ${timeLabel}${dose}.`,
        at: slot.reminderAt,
        extra: {
          alert: slot.medication.reminderAlert,
          name: slot.medication.name,
          time: timeLabel,
        },
      })
    }
  }

  return items.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED)
}

export function getNativePermissionState(): NativePermissionState {
  if (!isNativeApp()) return 'unsupported'
  return 'prompt'
}

export async function checkNativePermission(): Promise<NativePermissionState> {
  if (!isNativeApp()) return 'unsupported'
  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

export async function requestNativePermission(): Promise<NativePermissionState> {
  if (!isNativeApp()) return 'unsupported'
  await ensureAndroidChannel()
  const { display } = await LocalNotifications.requestPermissions()
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

export async function syncMedicationNotifications(data: AppData): Promise<void> {
  if (!isNativeApp()) return
  const permission = await checkNativePermission()
  if (permission !== 'granted') return

  await ensureAndroidChannel()

  const now = new Date()
  const upcoming = collectUpcomingNotifications(data, now)

  const { notifications: pending } = await LocalNotifications.getPending()
  if (pending.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.map((n) => ({ id: n.id })),
    })
  }

  if (upcoming.length === 0) return

  await LocalNotifications.schedule({
    notifications: upcoming.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      channelId: CHANNEL_ID,
      schedule: { at: item.at, allowWhileIdle: true },
      extra: item.extra,
    })),
  })
}

export async function scheduleSnoozeNotification(
  slot: DoseSlot,
  remindAt: number,
): Promise<void> {
  if (!isNativeApp()) return
  const permission = await checkNativePermission()
  if (permission !== 'granted') return

  await ensureAndroidChannel()

  const key = slotId(slot.medication.id, slot.date, slot.time)
  const timeLabel = formatTime(slot.time)
  const dose = slot.medication.dosage ? ` (${slot.medication.dosage})` : ''

  await LocalNotifications.schedule({
    notifications: [
      {
        id: snoozeNotificationId(key),
        title: `${slot.medication.name} reminder`,
        body: `Snoozed — take${dose} when you can.`,
        channelId: CHANNEL_ID,
        schedule: { at: new Date(remindAt), allowWhileIdle: true },
        extra: {
          alert: slot.medication.reminderAlert,
          name: slot.medication.name,
          time: timeLabel,
        },
      },
    ],
  })
}

export async function cancelSnoozeNotification(slot: DoseSlot): Promise<void> {
  if (!isNativeApp()) return
  const key = slotId(slot.medication.id, slot.date, slot.time)
  await LocalNotifications.cancel({
    notifications: [{ id: snoozeNotificationId(key) }],
  })
}

/** Play speech/sound when a native notification arrives while the app is open. */
export function attachNativeNotificationListeners(): () => void {
  if (!isNativeApp()) return () => {}

  const handleNotification = (notification: { extra?: unknown }) => {
    const extra = notification.extra as
      | { alert?: ReminderAlert; name?: string; time?: string }
      | undefined
    if (!extra?.name || !extra?.time) return
    triggerReminderAlert(extra.alert ?? 'speech', extra.name, extra.time)
  }

  const received = LocalNotifications.addListener('localNotificationReceived', handleNotification)

  const action = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    handleNotification(event.notification)
  })

  return () => {
    void received.then((h) => h.remove())
    void action.then((h) => h.remove())
  }
}
