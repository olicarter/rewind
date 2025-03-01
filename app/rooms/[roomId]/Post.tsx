'use client'

import { PostWithAuthor, Sentiment, db } from '@/app/db'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import styles from './CreatePostForm.module.css'
import { SentimentLabel } from './SentimentInputs'
import { useState } from 'react'
import { CreatePostForm } from './CreatePostForm'

export function Post(props: {
  meetingId: string
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
    <form className={styles.form}>
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
        <div>
          {isAuthor && <Button onClick={() => setEditing(true)}>Edit</Button>}
          <DeleteButton post={props.post} />
        </div>
      </footer>
    </form>
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
