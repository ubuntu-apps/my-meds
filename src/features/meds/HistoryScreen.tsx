import { useMemo, useState } from 'react'
import { Check, SkipForward, History as HistoryIcon } from 'lucide-react'
import type { AppData, DoseRecord } from './types'
import { formatTime } from './schedule'

interface HistoryScreenProps {
  data: AppData
  onResetInstallPrompt: () => void
}

interface DayGroup {
  date: string
  label: string
  records: DoseRecord[]
}

const ALL = '__all__'

export function HistoryScreen({ data, onResetInstallPrompt }: HistoryScreenProps) {
  const [medFilter, setMedFilter] = useState<string>(ALL)
  const [installResetNotice, setInstallResetNotice] = useState<string | null>(null)

  const medName = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of data.medications) map.set(m.id, m.name)
    return map
  }, [data.medications])

  // Medications that actually appear in the log, plus any still defined.
  const filterOptions = useMemo(() => {
    const ids = new Set<string>()
    for (const m of data.medications) ids.add(m.id)
    for (const r of Object.values(data.records)) ids.add(r.medId)
    return [...ids]
      .map((id) => ({ id, name: medName.get(id) ?? 'Removed medication' }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data.medications, data.records, medName])

  const filteredRecords = useMemo(() => {
    const all = Object.values(data.records)
    return medFilter === ALL ? all : all.filter((r) => r.medId === medFilter)
  }, [data.records, medFilter])

  const stats = useMemo(() => {
    let taken = 0
    let skipped = 0
    for (const r of filteredRecords) {
      if (r.status === 'taken') taken += 1
      else skipped += 1
    }
    const total = taken + skipped
    const adherence = total === 0 ? null : Math.round((taken / total) * 100)
    return { taken, skipped, total, adherence }
  }, [filteredRecords])

  const groups = useMemo<DayGroup[]>(() => {
    const byDate = new Map<string, DoseRecord[]>()
    for (const record of filteredRecords) {
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
  }, [filteredRecords])

  const hasAnyRecords = Object.keys(data.records).length > 0

  return (
    <section className="screen">
      <header className="screen__header">
        <div>
          <p className="screen__eyebrow">Your log</p>
          <h1>History</h1>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            onResetInstallPrompt()
            setInstallResetNotice('Install prompt banner reset for this device.')
          }}
        >
          Reset install prompt
        </button>
      </header>
      {installResetNotice && <p className="form__hint">{installResetNotice}</p>}

      {hasAnyRecords && (
        <>
          {filterOptions.length > 1 && (
            <div className="history__filter">
              <label htmlFor="history-med-filter">Medication</label>
              <select
                id="history-med-filter"
                value={medFilter}
                onChange={(e) => setMedFilter(e.target.value)}
              >
                <option value={ALL}>All medications</option>
                {filterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="stats" aria-label="Adherence summary">
            <div className="stat">
              <span className="stat__value">
                {stats.adherence === null ? '—' : `${stats.adherence}%`}
              </span>
              <span className="stat__label">Adherence</span>
            </div>
            <div className="stat">
              <span className="stat__value stat__value--good">{stats.taken}</span>
              <span className="stat__label">Taken</span>
            </div>
            <div className="stat">
              <span className="stat__value stat__value--danger">{stats.skipped}</span>
              <span className="stat__label">Skipped</span>
            </div>
          </div>
        </>
      )}

      {groups.length === 0 ? (
        <div className="empty">
          <HistoryIcon size={40} aria-hidden />
          <p>
            {hasAnyRecords
              ? 'No doses logged for this medication yet.'
              : 'No doses logged yet. Taken and skipped doses will show up here.'}
          </p>
        </div>
      ) : (
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
      )}
    </section>
  )
}
