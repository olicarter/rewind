import { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils'
import styles from './RadioButton.module.css'

export interface RadioButtonProps
  extends Omit<ComponentProps<'input'>, 'size'> {
  children: ReactNode
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function RadioButton({
  children,
  className,
  size,
  ...props
}: RadioButtonProps) {
  return (
    <>
      <label className={cn('button', size, styles.label, className)}>
        <input className={styles.input} type="radio" {...props} />
        {children}
      </label>
    </>
  )
}
