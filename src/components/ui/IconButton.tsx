import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({ label, children, className = '', ...props }: IconButtonProps) {
  return (
    <button type="button" className={`icon-btn ${className}`.trim()} aria-label={label} {...props}>
      {children}
    </button>
  )
}
