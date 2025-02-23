import { ComponentPropsWithoutRef, useEffect, useRef } from 'react'
import styles from './TextArea.module.css'
import { cn } from '@/utils'

export function TextArea({
  className,
  rows = 1,
  ...props
}: ComponentPropsWithoutRef<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(setHeight, [props.value])

  function setHeight() {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }

  return (
    <textarea
      className={cn(styles.textArea, className)}
      onInput={setHeight}
      ref={ref}
      rows={rows}
      {...props}
    />
  )
}
