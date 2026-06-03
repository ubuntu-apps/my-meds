import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { IconButton } from './IconButton'

interface BannerProps {
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
  'aria-label'?: string
}

export function Banner({
  icon,
  children,
  action,
  onDismiss,
  dismissLabel = 'Dismiss',
  className = '',
  'aria-label': ariaLabel,
}: BannerProps) {
  return (
    <section className={`banner ${className}`.trim()} aria-label={ariaLabel}>
      {icon}
      <div className="banner__text">{children}</div>
      {action}
      {onDismiss && (
        <IconButton label={dismissLabel} onClick={onDismiss}>
          <X size={18} />
        </IconButton>
      )}
    </section>
  )
}

export function BannerActionButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button variant="primary" size="sm" onClick={onClick}>
      {children}
    </Button>
  )
}
