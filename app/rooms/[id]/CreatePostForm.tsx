'use client'

import { db } from '@/app/db'
import { FormEvent, useEffect, useState } from 'react'
import styles from './CreatePostForm.module.css'
import { id } from '@instantdb/react'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import { Sentiment, useSentiment } from '@/hooks/useSentiment/useSentiment'
import { debounce } from 'lodash'
import { SentimentInput } from './SentimentInput'

export function CreatePostForm(props: { roomId: string; profileId: string }) {
  const [sentimentValue, setSentimentValue] = useState<Sentiment | null>(null)

  const sentiment = useSentiment()

  const debouncedClassify = debounce((text: string) => {
    sentiment.classify(text)
  }, 200)

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => debouncedClassify.cancel()
  }, [debouncedClassify])

  return (
    <form
      className={styles.form}
      onKeyDown={event => {
        if (event.metaKey && event.key === 'Enter') {
          event.currentTarget.requestSubmit()
        }
      }}
      onSubmit={createPost}
    >
      <input type="hidden" name="roomId" value={props.roomId} />
      <input type="hidden" name="profileId" value={props.profileId} />
      <TextArea
        autoFocus
        name="content"
        onChange={event => {
          if (!sentimentValue) {
            debouncedClassify(event.target.value)
          }
        }}
        required
      />
      <footer>
        <SentimentInput
          onChange={setSentimentValue}
          sentiment={sentiment.result}
          value={sentimentValue}
        />
        <Button>Create post</Button>
      </footer>
    </form>
  )
}

function createPost(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const formData = new FormData(event.currentTarget)
  const content = formData.get('content') as string
  const profileId = formData.get('profileId') as string
  const roomId = formData.get('roomId') as string
  const sentiment = formData.get('sentiment') as Sentiment
  const postId = id()
  db.transact([
    db.tx.posts[postId].update({
      content,
      roomId,
      sentiment,
    }),
    db.tx.posts[postId].link({ author: profileId }),
  ])
  event.currentTarget.reset()
}
