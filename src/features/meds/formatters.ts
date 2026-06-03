/** Parenthetical dose suffix for notifications, e.g. " (1 tablet)". */
export function formatDosageSuffix(dosage?: string): string {
  return dosage ? ` (${dosage})` : ''
}

/** Short weekday label from "YYYY-MM-DD". */
export function formatShortDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Long date for the Today screen header. */
export function formatLongDayLabel(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** Time a dose was recorded (locale-aware). */
export function formatRecordedTime(recordedAt: number): string {
  return new Date(recordedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}
