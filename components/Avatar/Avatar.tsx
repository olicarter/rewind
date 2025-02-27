import { cn } from '@/utils'
import { Avatar as RadixAvatar } from 'radix-ui'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  size?: 'small' | 'medium' | 'large'
}

export const Avatar = (props: AvatarProps) => (
  <RadixAvatar.Root
    className={cn(styles.root, props.size && styles[props.size])}
  >
    <RadixAvatar.Image alt={props.name} className={styles.image} />
    <RadixAvatar.Fallback>{props.name.charAt(0)}</RadixAvatar.Fallback>
  </RadixAvatar.Root>
)
