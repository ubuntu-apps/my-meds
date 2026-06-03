import { useEffect, useState } from 'react'
import { Bell, RefreshCw, X } from 'lucide-react'
import './App.css'
import { BottomNav } from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import { InstallAppBanner } from './components/InstallAppBanner'
import { useMeds } from './features/meds/useMeds'
import type { MedicationInput } from './features/meds/useMeds'
import { useReminders } from './features/meds/useReminders'
import { TodayScreen } from './features/meds/TodayScreen'
import { MedsScreen } from './features/meds/MedsScreen'
import { HistoryScreen } from './features/meds/HistoryScreen'
import { MedForm } from './features/meds/MedForm'
import type { Medication } from './features/meds/types'
import { APP_VERSION } from './version'
import { resetInstallBannerPreference } from './components/InstallAppBanner'

type FormState = { mode: 'add' } | { mode: 'edit'; med: Medication } | null

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [now, setNow] = useState(() => new Date())
  const [form, setForm] = useState<FormState>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [applyUpdate, setApplyUpdate] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  const meds = useMeds()
  const { permission, requestPermission, snooze, isNative } = useReminders(meds.data)

  // Re-evaluate dose statuses as time passes.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onUpdateAvailable = (
      event: Event & { detail?: { updateSW?: (reloadPage?: boolean) => Promise<void> } },
    ) => {
      if (!event.detail?.updateSW) return
      setApplyUpdate(() => event.detail!.updateSW!)
      setUpdateReady(true)
    }

    window.addEventListener('my-meds:update-available', onUpdateAvailable as EventListener)
    return () => {
      window.removeEventListener('my-meds:update-available', onUpdateAvailable as EventListener)
    }
  }, [])

  const handleSave = (input: MedicationInput) => {
    if (form?.mode === 'edit') {
      meds.updateMedication(form.med.id, input)
    } else {
      meds.addMedication(input)
    }
    setForm(null)
  }

  const handleDelete = () => {
    if (form?.mode === 'edit') {
      meds.deleteMedication(form.med.id)
      setForm(null)
    }
  }

  const showReminderBanner =
    !bannerDismissed &&
    (permission === 'default' || permission === 'denied') &&
    meds.data.medications.some((m) => m.active)

  return (
    <div className="app">
      <main className="app__main">
        <InstallAppBanner />

        {showReminderBanner && (
          <div className="banner">
            <Bell size={18} aria-hidden />
            <div className="banner__text">
              {permission === 'denied'
                ? 'Reminders are blocked. Enable notifications for this app in your browser settings.'
                : isNative
                  ? 'Get a reminder 15 minutes before each dose, even when the app is closed.'
                  : 'Get a reminder 15 minutes before each dose.'}
            </div>
            {permission === 'default' && (
              <button type="button" className="btn btn--primary btn--sm" onClick={requestPermission}>
                Enable
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {updateReady && applyUpdate && (
          <div className="banner">
            <RefreshCw size={18} aria-hidden />
            <div className="banner__text">A new version is ready. Update now to get the latest fixes.</div>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => void applyUpdate(true)}>
              Update
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setUpdateReady(false)}
              aria-label="Dismiss update prompt"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {tab === 'today' && (
          <TodayScreen
            data={meds.data}
            now={now}
            onTake={(slot) => meds.recordDose(slot.medication.id, slot.date, slot.time, 'taken')}
            onSkip={(slot) => meds.recordDose(slot.medication.id, slot.date, slot.time, 'skipped')}
            onUndo={(slot) => meds.clearDose(slot.medication.id, slot.date, slot.time)}
            onTakeAll={(slots) =>
              slots.forEach((slot) =>
                meds.recordDose(slot.medication.id, slot.date, slot.time, 'taken'),
              )
            }
            onSnooze={(slot) => snooze(slot)}
            canSnooze={permission === 'granted'}
            onLogAsNeeded={(med) => meds.logAsNeeded(med.id)}
            onUndoAsNeeded={(record) => meds.clearDose(record.medId, record.date, record.time)}
            onGoToMeds={() => {
              setTab('meds')
              setForm({ mode: 'add' })
            }}
          />
        )}

        {tab === 'meds' && (
          <MedsScreen
            data={meds.data}
            onAdd={() => setForm({ mode: 'add' })}
            onEdit={(med) => setForm({ mode: 'edit', med })}
            onToggleActive={(med, active) => meds.setActive(med.id, active)}
          />
        )}

        {tab === 'history' && (
          <HistoryScreen data={meds.data} onResetInstallPrompt={resetInstallBannerPreference} />
        )}

        <p className="app__version">My Meds v{APP_VERSION}</p>
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {form && (
        <MedForm
          initial={form.mode === 'edit' ? form.med : undefined}
          onSave={handleSave}
          onCancel={() => setForm(null)}
          onDelete={form.mode === 'edit' ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
