/** Speak a reminder using the browser's built-in text-to-speech. */
export function speakReminder(message: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.lang = navigator.language || 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}
