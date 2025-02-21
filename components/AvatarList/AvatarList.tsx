import { ReactNode } from 'react'
import styles from './AvatarList.module.css'
import { cn } from '@/utils/cn'

interface AvatarListProps {
  children: ReactNode
  className?: string
}

export const AvatarList = ({ className, ...props }: AvatarListProps) => (
  <ul className={cn(styles.list, className)}>{props.children}</ul>
)
