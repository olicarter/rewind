'use client'

import { useState } from 'react'
import { PostWithAuthor, Sentiment, Stage, db } from '@/app/db'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import { CreatePostForm } from './CreatePostForm'
import styles from './Post.module.css'
import { SentimentLabel } from './SentimentInputs'

export function Post(props: {
  meetingId: string
  meetingStage: Stage
  post: PostWithAuthor
  profileId: string
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <CreatePostForm
        meetingId={props.meetingId}
        onCancel={() => setEditing(false)}
        onSave={() => setEditing(false)}
        post={props.post}
        profileId={props.profileId}
      />
    )
  }

  const isAuthor = props.post?.author?.id === props.profileId

  return (
    <div className={styles.post}>
      {props.post && (
        <header className={styles.header}>
          <Avatar name={props.post.author?.name ?? ''} size="small" />
          <h4 className={styles.heading}>{props.post.author?.name}</h4>
        </header>
      )}
      <TextArea
        placeholder="What's on your mind?"
        readOnly
        required
        tabIndex={!props.post ? 0 : -1}
        value={props.post?.content}
      />
      <footer>
        <SentimentLabel sentiment={props.post.sentiment as Sentiment} />
        {props.meetingStage === Stage.Intro && (
          <div>
            {isAuthor && <Button onClick={() => setEditing(true)}>Edit</Button>}
            <DeleteButton post={props.post} />
          </div>
        )}
        {props.meetingStage === Stage.Discussion && (
          <Button disabled type="button">
            Vote
          </Button>
        )}
      </footer>
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
