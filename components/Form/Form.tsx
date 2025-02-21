import { ComponentProps } from 'react'
import styles from './Form.module.css'
import { cn } from '@/utils/cn'

export function Root({ className, ...props }: ComponentProps<'form'>) {
  return <form className={cn(styles.form, className)} {...props} />
}

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn(styles.field, className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn(styles.label, className)} {...props} />
}
