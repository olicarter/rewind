import { LucideIcon } from 'lucide-react'
import { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/utils'
import styles from './IconButton.module.css'


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
