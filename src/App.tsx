import { useEffect, useState } from 'react'
import { Bell, RefreshCw } from 'lucide-react'
import './App.css'
import { BottomNav } from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import { InstallAppBanner } from './components/InstallAppBanner'
import { Banner, BannerActionButton } from './components/ui'
import { useMeds } from './features/meds/useMeds'
import type { MedicationInput } from './features/meds/useMeds'
import { useReminders } from './features/meds/useReminders'
import { TodayScreen } from './features/meds/TodayScreen'
import { MedsScreen } from './features/meds/MedsScreen'
import { HistoryScreen } from './features/meds/HistoryScreen'
import { MedForm } from './features/meds/MedForm'
import type { Medication } from './features/meds/types'
import { APP_VERSION } from './version'

type FormState = { mode: 'add' } | { mode: 'edit'; med: Medication } | null

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [now, setNow] = useState(() => new Date())
  const [form, setForm] = useState<FormState>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [applyUpdate, setApplyUpdate] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  const meds = useMeds()
  const { permission, requestPermission, snooze } = useReminders(meds.data)

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

  const openAddForm = () => setForm({ mode: 'add' })

  return (
    <div className="app">
      <main className="app__main">
        <InstallAppBanner />

        {showReminderBanner && (
          <Banner
            icon={<Bell size={18} aria-hidden />}
            onDismiss={() => setBannerDismissed(true)}
            dismissLabel="Dismiss reminder prompt"
            action={
              permission === 'default' ? (
                <BannerActionButton onClick={requestPermission}>Enable</BannerActionButton>
              ) : undefined
            }
          >
            {permission === 'denied'
              ? 'Reminders are blocked. Enable notifications for this app in your browser settings.'
              : 'Get a reminder 15 minutes before each dose.'}
          </Banner>
        )}

        {updateReady && applyUpdate && (
          <Banner
            icon={<RefreshCw size={18} aria-hidden />}
            onDismiss={() => setUpdateReady(false)}
            dismissLabel="Dismiss update prompt"
            action={<BannerActionButton onClick={() => void applyUpdate(true)}>Update</BannerActionButton>}
          >
            A new version is ready. Update now to get the latest fixes.
          </Banner>
        )}

        {tab === 'today' && (
          <TodayScreen
            data={meds.data}
            now={now}
            canSnooze={permission === 'granted'}
            onTake={(slot) => meds.recordSlot(slot, 'taken')}
            onSkip={(slot) => meds.recordSlot(slot, 'skipped')}
            onUndo={meds.clearSlot}
            onTakeAll={meds.takeAllSlots}
            onSnooze={snooze}
            onLogAsNeeded={(med) => meds.logAsNeeded(med.id)}
            onUndoAsNeeded={meds.clearAsNeededRecord}
            onGoToMeds={() => {
              setTab('meds')
              openAddForm()
            }}
          />
        )}

        {tab === 'meds' && (
          <MedsScreen
            data={meds.data}
            onAdd={openAddForm}
            onEdit={(med) => setForm({ mode: 'edit', med })}
            onToggleActive={(med, active) => meds.setActive(med.id, active)}
          />
        )}

        {tab === 'history' && <HistoryScreen data={meds.data} />}

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
