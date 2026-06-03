import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Banner, BannerActionButton } from './ui/Banner'

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
    <Banner
      className="banner--install"
      icon={<Download size={18} aria-hidden />}
      aria-label="Install My Meds app"
      onDismiss={onDismiss}
      dismissLabel="Dismiss install prompt"
      action={
        showInstallButton ? (
          <BannerActionButton onClick={onInstall}>Install app</BannerActionButton>
        ) : undefined
      }
    >
      {showInstallButton ? (
        <>
          <strong>Install My Meds</strong> for a home-screen app experience.
        </>
      ) : (
        <>On iPhone: tap Share, then Add to Home Screen.</>
      )}
    </Banner>
  )
}

export function resetInstallBannerPreference() {
  localStorage.removeItem(INSTALL_BANNER_DISMISS_KEY)
}
