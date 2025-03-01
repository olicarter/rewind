import { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils'
import styles from './TextInput.module.css'

export function TextInput({
  className,
  ...props
}: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(styles.input, className)} {...props} />
}
