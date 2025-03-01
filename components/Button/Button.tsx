import { Slot } from 'radix-ui'
import { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils'
import styles from './Button.module.css'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
}

export function Button({ asChild, className, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return <Comp className={cn(styles.button, className)} {...props} />
}
