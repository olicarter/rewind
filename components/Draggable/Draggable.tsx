import { useDraggable } from '@dnd-kit/core'
import { ReactNode } from 'react'
import styles from './Draggable.module.css'

export interface DraggableProps {
  children: ReactNode
  id: string
}
export function Draggable(props: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      className={styles.draggable}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {props.children}
    </div>
  )
}
