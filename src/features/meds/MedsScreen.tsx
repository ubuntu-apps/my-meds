import { Plus, Pencil, Pill, CalendarDays } from 'lucide-react'
import type { AppData, Medication } from './types'
import { formatDays, formatSchedule, formatTime, sortMedications } from './schedule'

interface MedsScreenProps {
  data: AppData
  onAdd: () => void
  onEdit: (med: Medication) => void
  onToggleActive: (med: Medication, active: boolean) => void
}

export function MedsScreen({ data, onAdd, onEdit, onToggleActive }: MedsScreenProps) {
  const meds = sortMedications(data.medications)

  return (
    <section className="screen">
      <header className="screen__header">
        <div>
          <p className="screen__eyebrow">Your list</p>
          <h1>Medications</h1>
        </div>
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          <Plus size={18} /> Add
        </button>
      </header>

      {meds.length === 0 ? (
        <div className="empty">
          <Pill size={40} aria-hidden />
          <p>No medications yet. Add one to start tracking.</p>
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            Add medication
          </button>
        </div>
      ) : (
        <ul className="med-list">
          {meds.map((med) => (
            <li key={med.id} className={`med-card${med.active ? '' : ' is-inactive'}`}>
              <div className="med-card__main">
                <div className="med-card__name">{med.name}</div>
                {med.dosage && <div className="med-card__dose">{med.dosage}</div>}
                {med.scheduleKind === 'fixed' ? (
                  <div className="med-card__times">
                    {med.times.map((t) => (
                      <span key={t} className="time-chip">
                        {formatTime(t)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="med-card__times">
                    <span className="time-chip">{formatSchedule(med)}</span>
                  </div>
                )}
                {med.scheduleKind !== 'asNeeded' && (
                  <div className="med-card__days">
                    <CalendarDays size={14} aria-hidden />
                    {formatDays(med.days)}
                    <span className="time-chip">
                      {med.reminderAlert === 'sound' ? 'Sound reminder' : 'Speech reminder'}
                    </span>
                  </div>
                )}
                {med.notes && <div className="med-card__notes">{med.notes}</div>}
              </div>
              <div className="med-card__side">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onEdit(med)}
                  aria-label={`Edit ${med.name}`}
                >
                  <Pencil size={18} />
                </button>
                <label className="switch" title={med.active ? 'Active' : 'Paused'}>
                  <input
                    type="checkbox"
                    checked={med.active}
                    onChange={(e) => onToggleActive(med, e.target.checked)}
                  />
                  <span className="switch__track" aria-hidden />
                  <span className="switch__label">{med.active ? 'On' : 'Off'}</span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
