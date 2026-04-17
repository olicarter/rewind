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
    id: props.post.id,
    data: { type: 'post' },
  })
  const draggable = useDraggable({
    id: props.post.id,
    data: { groupId: props.post.group?.id },
  })

  const [editing, setEditing] = useState(false)

  async function toggleVote() {
    const votedBy = new Set<string>(JSON.parse(props.post.votedBy ?? '[]'))
    const newVotedBy = votedBy.has(props.profile.id)
      ? Array.from(votedBy).filter(id => id !== props.profile.id)
      : [...votedBy, props.profile.id]
    await db.transact([
      db.tx.posts[props.post.id].update({
        votedBy: JSON.stringify(newVotedBy),
      }),
    ])
  }

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
        draggable.setNodeRef(element)
        if (!props.post.group?.id) {
          droppable.setNodeRef(element)
        }
      }}
      style={
        props.meetingStage === Stage.Group
          ? {
              opacity: droppable.isOver && !draggable.isDragging ? 0.5 : 1,
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
      {[Stage.Intro].includes(props.meetingStage) && (
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
        </footer>
      )}
      {(props.meetingStage === Stage.Discussion || props.meetingStage === Stage.Group) && !props.post.group?.id && (
        <footer style={props.meetingStage === Stage.Group ? { visibility: 'hidden' } : undefined}>
          <div />
          <Button onClick={toggleVote} type="button">
            {props.post.votedBy?.includes(props.profile.id) ? 'Unvote' : 'Vote'}
          </Button>
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
