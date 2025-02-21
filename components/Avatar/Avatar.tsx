import { Avatar as RadixAvatar } from 'radix-ui'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
}

export const Avatar = (props: AvatarProps) => (
  <RadixAvatar.Root className={styles.root}>
    <RadixAvatar.Image alt={props.name} className={styles.image} />
    <RadixAvatar.Fallback>{props.name.charAt(0)}</RadixAvatar.Fallback>
  </RadixAvatar.Root>
)
