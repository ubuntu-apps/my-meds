import { CalendarCheck, Pill, History } from 'lucide-react'

export type Tab = 'today' | 'meds' | 'history'

const TABS: { id: Tab; label: string; Icon: typeof Pill }[] = [
  { id: 'today', label: 'Today', Icon: CalendarCheck },
  { id: 'meds', label: 'Meds', Icon: Pill },
  { id: 'history', label: 'History', Icon: History },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item${active === id ? ' is-active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={22} strokeWidth={2.2} aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
