import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  message: ReactNode
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <Icon size={40} aria-hidden />
      {typeof message === 'string' ? <p>{message}</p> : message}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
