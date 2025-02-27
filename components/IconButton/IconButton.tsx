import { cn } from '@/utils'
import { ComponentPropsWithoutRef } from 'react'
import styles from './IconButton.module.css'
import { LucideIcon } from 'lucide-react'

interface IconButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'children'> {
  icon: LucideIcon
}

export function IconButton({
  className,
  icon: Icon,
  ...props
}: IconButtonProps) {
  return (
    <button className={cn(styles.button, className)} {...props}>
      <Icon size={16} />
    </button>
  )
}
