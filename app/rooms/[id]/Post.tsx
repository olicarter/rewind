'use client'

import { db } from '@/app/db'
import { FormEvent, KeyboardEvent, useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import styles from './Post.module.css'
import { InstaQLEntity } from '@instantdb/react'
import schema from '@/instant.schema'
import { Sentiment } from '@/hooks/useSentimentAnalyser'

export type Post = InstaQLEntity<typeof schema, 'posts', { author: {} }>
export type Profile = InstaQLEntity<typeof schema, 'profiles'>

export function Post(props: { post: Post; profile: Profile }) {
  const [value, setValue] = useState(props.post.content)
  const isDirty = value !== props.post.content
  const isAuthor = props.post.author?.id === props.profile.id

  useEffect(() => {
    setValue(props.post.content)
  }, [props.post.content])

  function deletePost() {
    db.transact(db.tx.posts[props.post.id].delete())
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.metaKey && ['s', 'Enter'].includes(event.key)) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
    }
  }

  function updatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const content = formData.get('content') as string
    db.transact(db.tx.posts[props.post.id].update({ content }))
    event.currentTarget.reset()
  }

  return (
    <form
      className={styles.post}
      onKeyDown={handleKeyDown}
      onSubmit={updatePost}
    >
      <header>
        <p className={styles.author}>{props.post.author?.nickname} says:</p>
      </header>
      <TextArea
        name="content"
        onChange={event => setValue(event.currentTarget.value)}
        readOnly={!isAuthor}
        required
        value={value}
      />
      {isAuthor && (
        <footer>
          {/* <SentimentLabel sentiment={props.post.sentiment as Sentiment} /> */}
          <div>
            <Button disabled={!isDirty}>Save</Button>
            <Button onClick={deletePost} type="button">
              Delete
            </Button>
          </div>
        </footer>
      )}
    </form>
  )
}
