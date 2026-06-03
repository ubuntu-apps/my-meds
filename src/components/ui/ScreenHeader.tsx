import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  eyebrow?: string
  title: string
  trailing?: ReactNode
}

export function ScreenHeader({ eyebrow, title, trailing }: ScreenHeaderProps) {
  return (
    <header className="screen__header">
      <div>
        {eyebrow && <p className="screen__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {trailing}
    </header>
  )
}
