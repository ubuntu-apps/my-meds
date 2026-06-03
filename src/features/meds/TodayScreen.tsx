import { useMemo } from 'react'
import { CheckCheck, Pill, Plus, RotateCcw } from 'lucide-react'
import { Button, EmptyState, MedInfoFromMed, ScreenHeader } from '../../components/ui'
import type { AppData, DoseRecord, DoseSlot, Medication } from './types'
import { buildDaySlots, dateKey, formatTime, sortMedications } from './schedule'
import { formatLongDayLabel, formatRecordedTime } from './formatters'
import { DoseCard } from './components/DoseCard'

interface TodayScreenProps {
  data: AppData
  now: Date
  canSnooze: boolean
  onTake: (slot: DoseSlot) => void
  onSkip: (slot: DoseSlot) => void
  onUndo: (slot: DoseSlot) => void
  onTakeAll: (slots: DoseSlot[]) => void
  onSnooze: (slot: DoseSlot) => void
  onLogAsNeeded: (med: Medication) => void
  onUndoAsNeeded: (record: DoseRecord) => void
  onGoToMeds: () => void
}

function isPending(status: DoseSlot['status']): boolean {
  return status === 'due' || status === 'upcoming' || status === 'missed'
}

export function TodayScreen({
  data,
  now,
  canSnooze,
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
  const hasActiveMeds = data.medications.some((m) => m.active)
  const isEmpty = slots.length === 0 && asNeededMeds.length === 0

  return (
    <section className="screen">
      <ScreenHeader
        eyebrow={formatLongDayLabel(now)}
        title="Today"
        trailing={
          slots.length > 0 ? (
            <div className="progress-pill" aria-label={`${takenCount} of ${slots.length} doses taken`}>
              {takenCount}/{slots.length} taken
            </div>
          ) : undefined
        }
      />

      {pendingSlots.length > 0 && (
        <Button variant="ghost" className="mark-all" onClick={() => onTakeAll(pendingSlots)}>
          <CheckCheck size={18} /> Mark all taken ({pendingSlots.length})
        </Button>
      )}

      {isEmpty ? (
        <EmptyState
          icon={Pill}
          message={
            hasActiveMeds ? (
              'No doses scheduled for today.'
            ) : (
              <>
                <p>You haven't added any medications yet.</p>
              </>
            )
          }
          action={hasActiveMeds ? undefined : { label: 'Add your first medication', onClick: onGoToMeds }}
        />
      ) : (
        <ul className="dose-list">
          {slots.map((slot) => (
            <DoseCard
              key={slot.record?.id ?? `${slot.medication.id}-${slot.time}`}
              slot={slot}
              canSnooze={canSnooze}
              onTake={onTake}
              onSkip={onSkip}
              onUndo={onUndo}
              onSnooze={onSnooze}
            />
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
                    <MedInfoFromMed med={med} nameClassName="dose-card__name" />
                    {logged.length > 0 && (
                      <div className="as-needed__log">
                        {logged.map((record) => (
                          <span key={record.id} className="as-needed__entry">
                            {formatRecordedTime(record.recordedAt)}
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
                    <Button variant="primary" size="sm" onClick={() => onLogAsNeeded(med)}>
                      <Plus size={16} /> Log dose
                    </Button>
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
