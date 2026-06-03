import { Plus, Trash2, X } from 'lucide-react'
import type { Medication } from './types'
import type { MedicationInput } from './useMeds'
import { triggerReminderAlert } from './reminderAlert'
import { REMINDER_ALERT_HINT, REMINDER_ALERT_OPTIONS, SCHEDULE_OPTIONS } from './constants'
import { WEEKDAYS } from './schedule'
import { useMedFormState } from './useMedFormState'
import { Button, IconButton, SegmentedControl } from '../../components/ui'

interface MedFormProps {
  initial?: Medication
  onSave: (input: MedicationInput) => void
  onCancel: () => void
  onDelete?: () => void
}

export function MedForm({ initial, onSave, onCancel, onDelete }: MedFormProps) {
  const form = useMedFormState(initial)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = form.buildInput()
    if (input) onSave(input)
  }

  const handleTestReminder = () => {
    const medName = form.name.trim() || 'Medication'
    triggerReminderAlert(form.reminderAlert, medName, form.testReminderTime())
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={form.isEdit ? 'Edit medication' : 'Add medication'}>
      <div className="modal__panel">
        <header className="modal__header">
          <h2>{form.isEdit ? 'Edit medication' : 'Add medication'}</h2>
          <IconButton label="Close" onClick={onCancel}>
            <X size={20} />
          </IconButton>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              placeholder="e.g. Metformin"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Dose</span>
            <input
              type="text"
              value={form.dosage}
              onChange={(e) => form.setDosage(e.target.value)}
              placeholder="e.g. 1 tablet, 500 mg"
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              placeholder="e.g. Take with food"
              rows={2}
            />
          </label>

          <div className="field">
            <span>Schedule</span>
            <SegmentedControl
              label="Schedule type"
              value={form.scheduleKind}
              options={SCHEDULE_OPTIONS}
              onChange={form.setScheduleKind}
            />
          </div>

          {form.scheduleKind === 'fixed' && (
            <div className="field">
              <span>Times of day</span>
              <div className="times">
                {form.times.map((time, i) => (
                  <div className="times__row" key={i}>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => form.updateTime(i, e.target.value)}
                      aria-label={`Time ${i + 1}`}
                    />
                    <IconButton
                      label="Remove time"
                      onClick={() => form.removeTime(i)}
                      disabled={form.times.length <= 1}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </div>
                ))}
                <Button variant="ghost" onClick={form.addTime}>
                  <Plus size={18} /> Add another time
                </Button>
              </div>
            </div>
          )}

          {form.scheduleKind === 'interval' && (
            <div className="field-row">
              <label className="field">
                <span>Every</span>
                <div className="interval-input">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.intervalHours}
                    onChange={(e) => form.updateIntervalHours(e.target.value)}
                    aria-label="Interval in hours"
                  />
                  <span className="interval-input__unit">hours</span>
                </div>
              </label>
              <label className="field">
                <span>Starting at</span>
                <input
                  type="time"
                  value={form.intervalStart}
                  onChange={(e) => form.setIntervalStart(e.target.value)}
                  aria-label="First dose time"
                />
              </label>
            </div>
          )}

          {form.scheduleKind === 'asNeeded' && (
            <p className="form__hint">
              No fixed schedule or reminders. Log a dose from the Today screen whenever you take it.
            </p>
          )}

          {form.scheduleKind !== 'asNeeded' && (
            <div className="field">
              <span>Reminder</span>
              <SegmentedControl
                label="Reminder alert type"
                value={form.reminderAlert}
                options={REMINDER_ALERT_OPTIONS}
                onChange={form.setReminderAlert}
              />
              <p className="form__hint">{REMINDER_ALERT_HINT[form.reminderAlert]}</p>
              {import.meta.env.DEV && form.isEdit && (
                <Button variant="ghost" size="sm" onClick={handleTestReminder}>
                  Test reminder
                </Button>
              )}
            </div>
          )}

          {form.scheduleKind !== 'asNeeded' && (
            <div className="field">
              <span>Days</span>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.daily}
                  onChange={(e) => form.setDaily(e.target.checked)}
                />
                <span>Daily</span>
              </label>
              {!form.daily && (
                <div className="weekdays">
                  {WEEKDAYS.map((d) => (
                    <button
                      type="button"
                      key={d.value}
                      className={`day-chip${form.selectedDays.includes(d.value) ? ' is-selected' : ''}`}
                      aria-pressed={form.selectedDays.includes(d.value)}
                      onClick={() => form.toggleDay(d.value)}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.error && <p className="form__error">{form.error}</p>}

          <div className="form__actions">
            {onDelete && (
              <Button variant="danger" onClick={onDelete}>
                <Trash2 size={18} /> Delete
              </Button>
            )}
            <div className="form__actions-right">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <button type="submit" className="btn btn--primary">
                {form.isEdit ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
