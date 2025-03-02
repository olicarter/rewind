import { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils'
import styles from './CheckboxButton.module.css'

export interface CheckboxButtonProps
  extends Omit<ComponentProps<'input'>, 'size'> {
  children: ReactNode
  className?: string
  readOnly?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function CheckboxButton({
  children,
  className,
  size,
  readOnly,
  ...props
}: CheckboxButtonProps) {
  return (
    <label className={cn('button', size, styles.label, className)}>
      <input
        className={styles.input}
        disabled={readOnly}
        type="checkbox"
        {...props}
      />
      {children}
    </label>
  )
}
