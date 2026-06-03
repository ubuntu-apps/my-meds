import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { Medication, ReminderAlert, ScheduleKind } from './types'
import type { MedicationInput } from './useMeds'
import { triggerReminderAlert } from './reminderAlert'
import {
  DEFAULT_INTERVAL_HOURS,
  DEFAULT_INTERVAL_START,
  formatTime,
  isDaily,
  WEEKDAYS,
} from './schedule'

interface MedFormProps {
  initial?: Medication
  onSave: (input: MedicationInput) => void
  onCancel: () => void
  onDelete?: () => void
}

const SCHEDULE_OPTIONS: { value: ScheduleKind; label: string }[] = [
  { value: 'fixed', label: 'Set times' },
  { value: 'interval', label: 'Every X hours' },
  { value: 'asNeeded', label: 'As needed' },
]

const REMINDER_ALERT_OPTIONS: { value: ReminderAlert; label: string }[] = [
  { value: 'speech', label: 'Speech' },
  { value: 'sound', label: 'Sound' },
]

export function MedForm({ initial, onSave, onCancel, onDelete }: MedFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [dosage, setDosage] = useState(initial?.dosage ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>(initial?.scheduleKind ?? 'fixed')
  const [times, setTimes] = useState<string[]>(initial?.times.length ? initial.times : ['08:00'])
  const [intervalHours, setIntervalHours] = useState<number>(
    initial?.intervalHours ?? DEFAULT_INTERVAL_HOURS,
  )
  const [intervalStart, setIntervalStart] = useState<string>(
    initial?.intervalStart ?? DEFAULT_INTERVAL_START,
  )
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

  const handleTestReminder = () => {
    const medName = name.trim() || 'Medication'
    triggerReminderAlert(reminderAlert, medName, testReminderTime())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a medication name.')
      return
    }

    const cleanTimes = times.filter(Boolean)
    const days = daily ? [] : selectedDays

    if (scheduleKind === 'fixed') {
      if (cleanTimes.length === 0) {
        setError('Add at least one time of day.')
        return
      }
      if (!daily && selectedDays.length === 0) {
        setError('Pick at least one day, or choose Daily.')
        return
      }
    } else if (scheduleKind === 'interval') {
      if (!Number.isFinite(intervalHours) || intervalHours < 1 || intervalHours > 24) {
        setError('Enter an interval between 1 and 24 hours.')
        return
      }
      if (!daily && selectedDays.length === 0) {
        setError('Pick at least one day, or choose Daily.')
        return
      }
    }

    onSave({
      name,
      dosage,
      notes,
      scheduleKind,
      times: cleanTimes,
      days,
      intervalHours,
      intervalStart,
      reminderAlert: scheduleKind === 'asNeeded' ? undefined : reminderAlert,
    })
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={initial ? 'Edit medication' : 'Add medication'}>
      <div className="modal__panel">
        <header className="modal__header">
          <h2>{initial ? 'Edit medication' : 'Add medication'}</h2>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Dose</span>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 1 tablet, 500 mg"
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with food"
              rows={2}
            />
          </label>

          <div className="field">
            <span>Schedule</span>
            <div className="segmented" role="group" aria-label="Schedule type">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`segmented__btn${scheduleKind === opt.value ? ' is-active' : ''}`}
                  aria-pressed={scheduleKind === opt.value}
                  onClick={() => setScheduleKind(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {scheduleKind === 'fixed' && (
            <div className="field">
              <span>Times of day</span>
              <div className="times">
                {times.map((time, i) => (
                  <div className="times__row" key={i}>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(i, e.target.value)}
                      aria-label={`Time ${i + 1}`}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeTime(i)}
                      disabled={times.length <= 1}
                      aria-label="Remove time"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn--ghost" onClick={addTime}>
                  <Plus size={18} /> Add another time
                </button>
              </div>
            </div>
          )}

          {scheduleKind === 'interval' && (
            <div className="field-row">
              <label className="field">
                <span>Every</span>
                <div className="interval-input">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={intervalHours}
                    onChange={(e) => setIntervalHours(Number(e.target.value))}
                    aria-label="Interval in hours"
                  />
                  <span className="interval-input__unit">hours</span>
                </div>
              </label>
              <label className="field">
                <span>Starting at</span>
                <input
                  type="time"
                  value={intervalStart}
                  onChange={(e) => setIntervalStart(e.target.value)}
                  aria-label="First dose time"
                />
              </label>
            </div>
          )}

          {scheduleKind === 'asNeeded' && (
            <p className="form__hint">
              No fixed schedule or reminders. Log a dose from the Today screen whenever you take it.
            </p>
          )}

          {scheduleKind !== 'asNeeded' && (
            <div className="field">
              <span>Reminder</span>
              <div className="segmented" role="group" aria-label="Reminder alert type">
                {REMINDER_ALERT_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`segmented__btn${reminderAlert === opt.value ? ' is-active' : ''}`}
                    aria-pressed={reminderAlert === opt.value}
                    onClick={() => setReminderAlert(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="form__hint">
                {reminderAlert === 'speech'
                  ? 'Speaks the medication name and time when a reminder fires.'
                  : 'Plays a short chime when a reminder fires.'}
              </p>
              {initial && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleTestReminder}>
                  Test reminder (temp)
                </button>
              )}
            </div>
          )}

          {scheduleKind !== 'asNeeded' && (
            <div className="field">
              <span>Days</span>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={daily}
                  onChange={(e) => setDaily(e.target.checked)}
                />
                <span>Daily</span>
              </label>
              {!daily && (
                <div className="weekdays">
                  {WEEKDAYS.map((d) => (
                    <button
                      type="button"
                      key={d.value}
                      className={`day-chip${selectedDays.includes(d.value) ? ' is-selected' : ''}`}
                      aria-pressed={selectedDays.includes(d.value)}
                      onClick={() => toggleDay(d.value)}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="form__error">{error}</p>}

          <div className="form__actions">
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={onDelete}>
                <Trash2 size={18} /> Delete
              </button>
            )}
            <div className="form__actions-right">
              <button type="button" className="btn btn--ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                {initial ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
