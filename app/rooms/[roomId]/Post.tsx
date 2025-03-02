'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import {
  PostWithAuthor,
  Profile,
  Sentiment,
  Stage,
  db,
  sentimentLabels,
} from '@/app/db'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { RadioButton } from '@/components/RadioButton'
import { TextArea } from '@/components/TextArea'
import { cn } from '@/utils'
import { CreatePostForm } from './CreatePostForm'
import styles from './Post.module.css'

export function Post(props: {
  meetingId: string
  meetingStage: Stage
  post: PostWithAuthor
  profile: Profile
}) {
  const droppable = useDroppable({
    id: `droppable-${props.post.id}`,
  })
  const draggable = useDraggable({
    id: `draggable-${props.post.id}`,
  })

  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <CreatePostForm
        meetingId={props.meetingId}
        onCancel={() => setEditing(false)}
        onSave={() => setEditing(false)}
        post={props.post}
        profile={props.profile}
      />
    )
  }

  const isAuthor = props.post?.author?.id === props.profile.id

  return (
    <div
      className={cn(
        styles.post,
        props.meetingStage === Stage.Group && styles.draggable
      )}
      ref={element => {
        if (props.meetingStage === Stage.Group) {
          draggable.setNodeRef(element)
          if (!draggable.isDragging) {
            droppable.setNodeRef(element)
          }
        }
      }}
      style={
        props.meetingStage === Stage.Group
          ? {
              opacity: droppable.isOver ? 0.5 : 1,
              transform: draggable.transform
                ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`
                : undefined,
              zIndex: draggable.isDragging ? 1000 : undefined,
            }
          : undefined
      }
      {...(props.meetingStage === Stage.Group && {
        ...draggable.listeners,
        ...draggable.attributes,
      })}
    >
      {props.post && (
        <header className={styles.header}>
          <div>
            <Avatar name={props.post.author?.name ?? ''} size="medium" />
            <h4 className={styles.heading}>{props.post.author?.name}</h4>
          </div>
          <RadioButton
            className={props.post.sentiment.toLowerCase()}
            readOnly
            size="small"
            value={props.post.sentiment}
          >
            {sentimentLabels[props.post.sentiment as Sentiment]}
          </RadioButton>
        </header>
      )}
      <TextArea
        placeholder="What's on your mind?"
        readOnly
        required
        tabIndex={!props.post ? 0 : -1}
        value={props.post?.content}
      />
      {[Stage.Intro, Stage.Discussion].includes(props.meetingStage) && (
        <footer>
          <div />
          {props.meetingStage === Stage.Intro && (
            <div>
              {isAuthor && (
                <Button onClick={() => setEditing(true)}>Edit</Button>
              )}
              <DeleteButton post={props.post} />
            </div>
          )}
          {props.meetingStage === Stage.Discussion && (
            <Button disabled type="button">
              Vote
            </Button>
          )}
        </footer>
      )}
    </div>
  )
}

function DeleteButton(props: { post: PostWithAuthor }) {
  function deletePost() {
    if (!props.post.id) return
    db.transact(db.tx.posts[props.post.id].delete())
  }

  return (
    <Button onClick={deletePost} type="button">
      Delete
    </Button>
  )
}
