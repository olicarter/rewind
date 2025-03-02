import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'
import styles from './Draggable.module.css'

export interface DroppableProps {
  children: ReactNode
  id: string
}
export function Droppable(props: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  })

  const style = isOver ? { opacity: 0.5 } : {}

  return (
    <div className={styles.droppable} ref={setNodeRef} style={style}>
      {props.children}
    </div>
  )
}
