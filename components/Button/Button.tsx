import { Slot } from 'radix-ui'
import { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils'
import styles from './Button.module.css'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function Button({
  asChild,
  className,
  size = 'medium',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp className={cn('button', size, styles.button, className)} {...props} />
  )
}
