import { ComponentPropsWithoutRef, useEffect, useRef } from 'react'
import { RefCallBack } from 'react-hook-form'
import { cn } from '@/utils'
import styles from './TextArea.module.css'

export function TextArea({
  className,
  ref,
  rows = 1,
  ...props
}: ComponentPropsWithoutRef<'textarea'> & { ref?: RefCallBack }) {
  const localRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fitHeightToContent()
  }, [props.value])

  // Update height when the viewport size changes
  useEffect(() => {
    window.addEventListener('resize', fitHeightToContent)
    return () => {
      window.removeEventListener('resize', fitHeightToContent)
    }
  }, [])

  function fitHeightToContent() {
    if (localRef.current) {
      localRef.current.style.height = 'auto'
      localRef.current.style.height = `${localRef.current.scrollHeight}px`
    }
  }

  return (
    <textarea
      className={cn(styles.textArea, className)}
      onInput={fitHeightToContent}
      ref={element => {
        ref?.(element)
        localRef.current = element
      }}
      rows={rows}
      {...props}
    />
  )
}
