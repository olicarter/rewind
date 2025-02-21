import { cn } from '@/utils/cn'
import { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'

export function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return <button className={cn(styles.button, className)} {...props} />
}
