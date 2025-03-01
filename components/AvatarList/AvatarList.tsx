import { ReactNode } from 'react'
import { cn } from '@/utils'
import styles from './AvatarList.module.css'

interface AvatarListProps {
  children: ReactNode
  className?: string
}

export const AvatarList = ({ className, ...props }: AvatarListProps) => (
  <ul className={cn(styles.list, className)}>{props.children}</ul>
)
