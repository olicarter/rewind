import { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils'
import styles from './TextInput.module.css'

interface TextInputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  size?: 'small' | 'medium' | 'large'
}

export function TextInput({
  className,
  size = 'medium',
  ...props
}: TextInputProps) {
  return (
    <input className={cn(styles.input, className, styles[size])} {...props} />
  )
}
