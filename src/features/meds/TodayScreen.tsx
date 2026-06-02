import { useMemo } from 'react'
import { Check, Clock, RotateCcw, SkipForward, Pill, Plus, CheckCheck, AlarmClock } from 'lucide-react'
import type { AppData, DoseRecord, DoseSlot, Medication } from './types'
import { buildDaySlots, dateKey, formatTime, sortMedications } from './schedule'

interface TodayScreenProps {
  data: AppData
  now: Date
  onTake: (slot: DoseSlot) => void
  onSkip: (slot: DoseSlot) => void
  onUndo: (slot: DoseSlot) => void
  onTakeAll: (slots: DoseSlot[]) => void
  onSnooze: (slot: DoseSlot) => void
  onLogAsNeeded: (med: Medication) => void
  onUndoAsNeeded: (record: DoseRecord) => void
  onGoToMeds: () => void
}

/** A dose slot is "pending" when it still needs the user's attention today. */
function isPending(status: DoseSlot['status']): boolean {
  return status === 'due' || status === 'upcoming' || status === 'missed'
}

const STATUS_LABEL: Record<DoseSlot['status'], string> = {
  upcoming: 'Upcoming',
  due: 'Due now',
  taken: 'Taken',
  skipped: 'Skipped',
  missed: 'Missed',
}

export function TodayScreen({
  data,
  now,
  onTake,
  onSkip,
  onUndo,
  onTakeAll,
  onSnooze,
  onLogAsNeeded,
  onUndoAsNeeded,
  onGoToMeds,
}: TodayScreenProps) {
  const slots = useMemo(() => buildDaySlots(data, now, now), [data, now])
  const pendingSlots = useMemo(() => slots.filter((s) => isPending(s.status)), [slots])

  const asNeededMeds = useMemo(
    () => sortMedications(data.medications.filter((m) => m.active && m.scheduleKind === 'asNeeded')),
    [data.medications],
  )

  const today = dateKey(now)
  const asNeededToday = useMemo(() => {
    const byMed = new Map<string, DoseRecord[]>()
    for (const record of Object.values(data.records)) {
      if (record.date !== today) continue
      const list = byMed.get(record.medId) ?? []
      list.push(record)
      byMed.set(record.medId, list)
    }
    for (const list of byMed.values()) list.sort((a, b) => a.recordedAt - b.recordedAt)
    return byMed
  }, [data.records, today])

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

      {pendingSlots.length > 0 && (
        <button
          type="button"
          className="btn btn--ghost mark-all"
          onClick={() => onTakeAll(pendingSlots)}
        >
          <CheckCheck size={18} /> Mark all taken ({pendingSlots.length})
        </button>
      )}

      {slots.length === 0 && asNeededMeds.length === 0 ? (
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
                    {(slot.status === 'due' || slot.status === 'missed') && (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onSnooze(slot)}>
                        <AlarmClock size={16} /> Snooze
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {asNeededMeds.length > 0 && (
        <div className="as-needed">
          <h2 className="as-needed__heading">As needed</h2>
          <ul className="dose-list">
            {asNeededMeds.map((med) => {
              const logged = asNeededToday.get(med.id) ?? []
              return (
                <li key={med.id} className="dose-card is-asNeeded">
                  <div className="dose-card__body">
                    <div className="dose-card__name">{med.name}</div>
                    {med.dosage && <div className="dose-card__dose">{med.dosage}</div>}
                    {med.notes && <div className="dose-card__notes">{med.notes}</div>}
                    {logged.length > 0 && (
                      <div className="as-needed__log">
                        {logged.map((record) => (
                          <span key={record.id} className="as-needed__entry">
                            {new Date(record.recordedAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            <button
                              type="button"
                              className="as-needed__undo"
                              onClick={() => onUndoAsNeeded(record)}
                              aria-label={`Undo ${med.name} dose at ${formatTime(record.time)}`}
                            >
                              <RotateCcw size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dose-card__actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => onLogAsNeeded(med)}
                    >
                      <Plus size={16} /> Log dose
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
