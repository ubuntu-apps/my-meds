import { useMemo } from 'react'
import { Check, Clock, RotateCcw, SkipForward, Pill } from 'lucide-react'
import type { AppData, DoseSlot } from './types'
import { buildDaySlots, formatTime } from './schedule'

interface TodayScreenProps {
  data: AppData
  now: Date
  onTake: (slot: DoseSlot) => void
  onSkip: (slot: DoseSlot) => void
  onUndo: (slot: DoseSlot) => void
  onGoToMeds: () => void
}

const STATUS_LABEL: Record<DoseSlot['status'], string> = {
  upcoming: 'Upcoming',
  due: 'Due now',
  taken: 'Taken',
  skipped: 'Skipped',
  missed: 'Missed',
}

export function TodayScreen({ data, now, onTake, onSkip, onUndo, onGoToMeds }: TodayScreenProps) {
  const slots = useMemo(() => buildDaySlots(data, now, now), [data, now])

  const takenCount = slots.filter((s) => s.status === 'taken').length
  const dateLabel = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const hasActiveMeds = data.medications.some((m) => m.active)

  return (
    <section className="screen">
      <header className="screen__header">
        <div>
          <p className="screen__eyebrow">{dateLabel}</p>
          <h1>Today</h1>
        </div>
        {slots.length > 0 && (
          <div className="progress-pill" aria-label={`${takenCount} of ${slots.length} doses taken`}>
            {takenCount}/{slots.length} taken
          </div>
        )}
      </header>

      {slots.length === 0 ? (
        <div className="empty">
          <Pill size={40} aria-hidden />
          {hasActiveMeds ? (
            <p>No doses scheduled for today.</p>
          ) : (
            <>
              <p>You haven't added any medications yet.</p>
              <button type="button" className="btn btn--primary" onClick={onGoToMeds}>
                Add your first medication
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className="dose-list">
          {slots.map((slot) => (
            <li key={slot.record?.id ?? `${slot.medication.id}-${slot.time}`} className={`dose-card is-${slot.status}`}>
              <div className="dose-card__time">
                <Clock size={16} aria-hidden />
                {formatTime(slot.time)}
              </div>
              <div className="dose-card__body">
                <div className="dose-card__name">{slot.medication.name}</div>
                {slot.medication.dosage && (
                  <div className="dose-card__dose">{slot.medication.dosage}</div>
                )}
                {slot.medication.notes && (
                  <div className="dose-card__notes">{slot.medication.notes}</div>
                )}
                <span className={`status-badge status-badge--${slot.status}`}>
                  {STATUS_LABEL[slot.status]}
                  {slot.status === 'taken' && slot.record
                    ? ` · ${new Date(slot.record.recordedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : ''}
                </span>
              </div>
              <div className="dose-card__actions">
                {slot.status === 'taken' || slot.status === 'skipped' ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onUndo(slot)}>
                    <RotateCcw size={16} /> Undo
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => onTake(slot)}>
                      <Check size={16} /> Take
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onSkip(slot)}>
                      <SkipForward size={16} /> Skip
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
