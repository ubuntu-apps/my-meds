import { useEffect, useMemo, useState } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export const INSTALL_BANNER_DISMISS_KEY = 'my-meds:install-banner-dismissed'

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(iosNavigator.standalone)
}

export function InstallAppBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(
    () => localStorage.getItem(INSTALL_BANNER_DISMISS_KEY) === '1',
  )
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isInStandaloneMode())
  const ios = useMemo(() => isIos(), [])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (dismissed || isInstalled) return null

  const onDismiss = () => {
    localStorage.setItem(INSTALL_BANNER_DISMISS_KEY, '1')
    setDismissed(true)
  }

  const onInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      setInstallEvent(null)
    }
  }

  const showInstallButton = Boolean(installEvent) && !ios
  const showIosInstructions = ios && !installEvent

  if (!showInstallButton && !showIosInstructions) return null

  return (
    <section className="banner banner--install" aria-label="Install My Meds app">
      <Download size={18} aria-hidden />
      <div className="banner__text">
        {showInstallButton ? (
          <>
            <strong>Install My Meds</strong> for a home-screen app experience.
          </>
        ) : (
          <>On iPhone: tap Share, then Add to Home Screen.</>
        )}
      </div>
      {showInstallButton && (
        <button type="button" className="btn btn--primary btn--sm" onClick={onInstall}>
          Install app
        </button>
      )}
      <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss install prompt">
        <X size={18} />
      </button>
    </section>
  )
}

export function resetInstallBannerPreference() {
  localStorage.removeItem(INSTALL_BANNER_DISMISS_KEY)
}
