import type { ButtonHTMLAttributes } from 'react'
import './Button.css'

type Variant = 'dark' | 'tonal' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button({ variant = 'dark', className, ...props }: ButtonProps) {
  return <button className={`btn btn--${variant} ${className ?? ''}`} {...props} />
}
