import { cn } from '@/utils'
import { ComponentPropsWithoutRef } from 'react'
import styles from './TextInput.module.css'

export function TextInput({
  className,
  ...props
}: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(styles.input, className)} {...props} />
}
