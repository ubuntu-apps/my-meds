import { useMemo } from 'react'
import { Check, SkipForward, History as HistoryIcon } from 'lucide-react'
import type { AppData, DoseRecord } from './types'
import { formatTime } from './schedule'

interface HistoryScreenProps {
  data: AppData
}

interface DayGroup {
  date: string
  label: string
  records: DoseRecord[]
}

export function HistoryScreen({ data }: HistoryScreenProps) {
  const medName = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of data.medications) map.set(m.id, m.name)
    return map
  }, [data.medications])

  const groups = useMemo<DayGroup[]>(() => {
    const byDate = new Map<string, DoseRecord[]>()
    for (const record of Object.values(data.records)) {
      const list = byDate.get(record.date) ?? []
      list.push(record)
      byDate.set(record.date, list)
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, records]) => {
        const [y, m, d] = date.split('-').map(Number)
        const label = new Date(y, m - 1, d).toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        records.sort((a, b) => (a.time < b.time ? -1 : 1))
        return { date, label, records }
      })
  }, [data.records])

  if (groups.length === 0) {
    return (
      <section className="screen">
        <header className="screen__header">
          <div>
            <p className="screen__eyebrow">Your log</p>
            <h1>History</h1>
          </div>
        </header>
        <div className="empty">
          <HistoryIcon size={40} aria-hidden />
          <p>No doses logged yet. Taken and skipped doses will show up here.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <header className="screen__header">
        <div>
          <p className="screen__eyebrow">Your log</p>
          <h1>History</h1>
        </div>
      </header>

      <div className="history">
        {groups.map((group) => (
          <div key={group.date} className="history__day">
            <h2 className="history__date">{group.label}</h2>
            <ul className="history__list">
              {group.records.map((record) => (
                <li key={record.id} className={`history__item is-${record.status}`}>
                  <span className="history__icon">
                    {record.status === 'taken' ? <Check size={16} /> : <SkipForward size={16} />}
                  </span>
                  <span className="history__name">{medName.get(record.medId) ?? 'Removed medication'}</span>
                  <span className="history__time">{formatTime(record.time)}</span>
                  <span className={`history__status history__status--${record.status}`}>
                    {record.status === 'taken' ? 'Taken' : 'Skipped'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
