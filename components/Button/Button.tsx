import { cn } from '@/utils'
import { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'
import { Slot } from 'radix-ui'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
  secondary?: boolean
}

export function Button({
  asChild,
  className,
  secondary,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      className={cn(styles.button, secondary && styles.secondary, className)}
      {...props}
    />
  )
}
