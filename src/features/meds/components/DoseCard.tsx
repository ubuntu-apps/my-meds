import { Check, Clock, RotateCcw, SkipForward, AlarmClock } from 'lucide-react'
import type { DoseSlot } from '../types'
import { STATUS_LABEL } from '../constants'
import { formatRecordedTime } from '../formatters'
import { formatTime } from '../schedule'
import { Button } from '../../../components/ui/Button'
import { MedInfoFromMed } from '../../../components/ui/MedInfo'

interface DoseCardProps {
  slot: DoseSlot
  canSnooze: boolean
  onTake: (slot: DoseSlot) => void
  onSkip: (slot: DoseSlot) => void
  onUndo: (slot: DoseSlot) => void
  onSnooze: (slot: DoseSlot) => void
}

export function DoseCard({ slot, canSnooze, onTake, onSkip, onUndo, onSnooze }: DoseCardProps) {
  const { status, record } = slot
  const showSnooze = canSnooze && (status === 'due' || status === 'missed')

  return (
    <li className={`dose-card is-${status}`}>
      <div className="dose-card__time">
        <Clock size={16} aria-hidden />
        {formatTime(slot.time)}
      </div>
      <div className="dose-card__body">
        <MedInfoFromMed med={slot.medication} nameClassName="dose-card__name" />
        <span className={`status-badge status-badge--${status}`}>
          {STATUS_LABEL[status]}
          {status === 'taken' && record ? ` · ${formatRecordedTime(record.recordedAt)}` : ''}
        </span>
      </div>
      <div className="dose-card__actions">
        {status === 'taken' || status === 'skipped' ? (
          <Button variant="ghost" size="sm" onClick={() => onUndo(slot)}>
            <RotateCcw size={16} /> Undo
          </Button>
        ) : (
          <>
            <Button variant="primary" size="sm" onClick={() => onTake(slot)}>
              <Check size={16} /> Take
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSkip(slot)}>
              <SkipForward size={16} /> Skip
            </Button>
            {showSnooze && (
              <Button variant="ghost" size="sm" onClick={() => onSnooze(slot)}>
                <AlarmClock size={16} /> Snooze
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  )
}
