import { cn } from '@/utils/cn'
import { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'
import { Slot } from 'radix-ui'

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
}

export function Button({ asChild, className, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return <Comp className={cn(styles.button, className)} {...props} />
}
