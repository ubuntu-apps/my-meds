import type { ReminderAlert } from './types'

/** Spoken reminder: medication name and scheduled time only. */
export function buildReminderSpeech(name: string, time: string): string {
  return `${name} at ${time}`
}

export function speakReminder(message: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.lang = navigator.language || 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

let audioCtx: AudioContext | null = null

/** Short two-tone chime for sound reminders. */
export function playReminderSound(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    audioCtx ??= new Ctx()
    const ctx = audioCtx
    if (ctx.state === 'suspended') void ctx.resume()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.2, start)
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration)
      osc.start(start)
      osc.stop(start + duration)
    }

    const t = ctx.currentTime
    playTone(523.25, t, 0.15)
    playTone(659.25, t + 0.18, 0.2)
  } catch {
    // Audio may be blocked until user interaction.
  }
}

export function triggerReminderAlert(alert: ReminderAlert, name: string, time: string): void {
  if (alert === 'sound') playReminderSound()
  else speakReminder(buildReminderSpeech(name, time))
}
