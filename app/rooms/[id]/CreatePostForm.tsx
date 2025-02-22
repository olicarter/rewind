'use client'

import { db } from '@/app/db'
import { FormEvent, useEffect, useState } from 'react'
import styles from './CreatePostForm.module.css'
import { id, InstaQLEntity } from '@instantdb/react'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import {
  isSentiment,
  Sentiment,
  useSentimentAnalyser,
} from '@/hooks/useSentimentAnalyser'
import { debounce } from 'lodash'
import { SentimentInput, SentimentInputs } from './SentimentInputs'
import schema from '@/instant.schema'

export type Post = InstaQLEntity<typeof schema, 'posts', { author: {} }>

export function CreatePostForm(props: {
  post?: Post
  profileId: string
  roomId: string
}) {
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(
    null
  )
  const [content, setContent] = useState(props.post?.content ?? '')
  const isAuthor = props.post?.author?.id === props.profileId
  const isDirty = content.trim() !== props.post?.content && isAuthor
  const sentiment = useSentimentAnalyser()

  const debouncedClassify = debounce((text: string) => {
    sentiment.classify(text)
  }, 200)

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => debouncedClassify.cancel()
  }, [debouncedClassify])

  useEffect(() => {
    if (!selectedSentiment || !sentiment.result || !!content.trim().length) {
      debouncedClassify(content)
    }
  }, [content, debouncedClassify, selectedSentiment, sentiment.result])

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const content = formData.get('content') as string
    const postId = formData.get('postId') as string
    const profileId = formData.get('profileId') as string
    const roomId = formData.get('roomId') as string
    const sentiment = formData.get('sentiment') as string
    if (!isSentiment(sentiment)) {
      throw new Error('Invalid sentiment')
    }
    event.currentTarget.reset()
    setContent('')
    setSelectedSentiment(null)
    await db.transact([
      db.tx.posts[postId].update({
        content,
        roomId,
        sentiment,
      }),
      db.tx.posts[postId].link({ author: profileId }),
    ])
  }

  async function updatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const content = formData.get('content') as string
    const postId = formData.get('postId') as string
    const profileId = formData.get('profileId') as string
    const roomId = formData.get('roomId') as string
    const sentiment = formData.get('sentiment') as string
    if (!isSentiment(sentiment)) {
      throw new Error('Invalid sentiment')
    }
    await db.transact([
      db.tx.posts[postId].update({
        content,
        roomId,
        sentiment,
      }),
      db.tx.posts[postId].link({ author: profileId }),
    ])
  }

  return (
    <form
      className={styles.form}
      onKeyDown={event => {
        if (event.metaKey && event.key === 'Enter') {
          event.currentTarget.requestSubmit()
        }
      }}
      onSubmit={isAuthor ? updatePost : createPost}
    >
      <input type="hidden" name="postId" value={props.post?.id ?? id()} />
      <input type="hidden" name="profileId" value={props.profileId} />
      <input type="hidden" name="roomId" value={props.roomId} />
      <TextArea
        autoFocus={!props.post}
        name="content"
        onChange={event => {
          setContent(event.target.value)
          setSelectedSentiment(null)
        }}
        placeholder="What's on your mind?"
        readOnly={props.post && !isAuthor}
        required
        value={isAuthor ? content : props.post?.content}
      />
      <footer>
        {props.post && !isDirty ? (
          <SentimentInput
            id={`${props.post.sentiment}-${props.post.id}`}
            label={props.post.sentiment as Sentiment}
            onChange={setSelectedSentiment}
            readOnly
            value={props.post.sentiment as Sentiment}
          />
        ) : (
          <SentimentInputs
            analyzedSentiment={sentiment.result}
            onChange={setSelectedSentiment}
            selectedSentiment={selectedSentiment}
          />
        )}
        <div>
          {!props.post && <Button>Create</Button>}
          {isAuthor && (
            <>
              <Button disabled={!isDirty || !content.trim().length}>
                Save
              </Button>
              <Button
                onClick={() => {
                  if (props.post) deletePost(props.post?.id)
                }}
                type="button"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </footer>
    </form>
  )
}

function deletePost(postId: string) {
  db.transact(db.tx.posts[postId].delete())
}
