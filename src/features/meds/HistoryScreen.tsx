import { useMemo, useState } from 'react'
import { Check, SkipForward, History as HistoryIcon } from 'lucide-react'
import { Button, EmptyState, ScreenHeader } from '../../components/ui'
import { resetInstallBannerPreference } from '../../components/InstallAppBanner'
import type { AppData, DoseRecord } from './types'
import { formatTime } from './schedule'
import { HISTORY_FILTER_ALL } from './constants'
import { formatShortDayLabel } from './formatters'
import { buildMedicationNameMap } from './medNames'

interface HistoryScreenProps {
  data: AppData
}

interface DayGroup {
  date: string
  label: string
  records: DoseRecord[]
}

export function HistoryScreen({ data }: HistoryScreenProps) {
  const [medFilter, setMedFilter] = useState<string>(HISTORY_FILTER_ALL)
  const [installResetNotice, setInstallResetNotice] = useState<string | null>(null)

  const medName = useMemo(() => buildMedicationNameMap(data), [data])

  const filterOptions = useMemo(() => {
    return [...medName.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [medName])

  const filteredRecords = useMemo(() => {
    const all = Object.values(data.records)
    return medFilter === HISTORY_FILTER_ALL ? all : all.filter((r) => r.medId === medFilter)
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
        records.sort((a, b) => (a.time < b.time ? -1 : 1))
        return { date, label: formatShortDayLabel(date), records }
      })
  }, [filteredRecords])

  const hasAnyRecords = Object.keys(data.records).length > 0

  return (
    <section className="screen">
      <ScreenHeader eyebrow="Your log" title="History" />

      {import.meta.env.DEV && (
        <div className="history__dev">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetInstallBannerPreference()
              setInstallResetNotice('Install prompt banner reset for this device.')
            }}
          >
            Reset install prompt
          </Button>
          {installResetNotice && <p className="form__hint">{installResetNotice}</p>}
        </div>
      )}

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
                <option value={HISTORY_FILTER_ALL}>All medications</option>
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
        <EmptyState
          icon={HistoryIcon}
          message={
            hasAnyRecords
              ? 'No doses logged for this medication yet.'
              : 'No doses logged yet. Taken and skipped doses will show up here.'
          }
        />
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
