import { Pencil, CalendarDays } from 'lucide-react'
import type { Medication } from '../types'
import { formatDays, formatSchedule, formatTime } from '../schedule'
import { IconButton } from '../../../components/ui/IconButton'
import { MedInfo } from '../../../components/ui/MedInfo'

interface MedCardProps {
  med: Medication
  onEdit: (med: Medication) => void
  onToggleActive: (med: Medication, active: boolean) => void
}

function reminderLabel(alert: Medication['reminderAlert']): string {
  return alert === 'sound' ? 'Sound reminder' : 'Speech reminder'
}

export function MedCard({ med, onEdit, onToggleActive }: MedCardProps) {
  return (
    <li className={`med-card${med.active ? '' : ' is-inactive'}`}>
      <div className="med-card__main">
        <MedInfo
          name={med.name}
          dosage={med.dosage}
          notes={med.notes}
          nameClassName="med-card__name"
          doseClassName="med-card__dose"
          notesClassName="med-card__notes"
        />
        <div className="med-card__times">
          {med.scheduleKind === 'fixed' ? (
            med.times.map((t) => (
              <span key={t} className="time-chip">
                {formatTime(t)}
              </span>
            ))
          ) : (
            <span className="time-chip">{formatSchedule(med)}</span>
          )}
        </div>
        {med.scheduleKind !== 'asNeeded' && (
          <div className="med-card__days">
            <CalendarDays size={14} aria-hidden />
            {formatDays(med.days)}
            <span className="time-chip">{reminderLabel(med.reminderAlert)}</span>
          </div>
        )}
      </div>
      <div className="med-card__side">
        <IconButton label={`Edit ${med.name}`} onClick={() => onEdit(med)}>
          <Pencil size={18} />
        </IconButton>
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
  )
}
