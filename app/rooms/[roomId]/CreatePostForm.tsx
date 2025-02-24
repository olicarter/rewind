'use client'

import { db, PostWithAuthor } from '@/app/db'
import { FormEvent, useEffect, useState } from 'react'
import styles from './CreatePostForm.module.css'
import { id } from '@instantdb/react'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import { Sentiment, useSentimentAnalyser } from '@/hooks/useSentimentAnalyser'
import { debounce } from 'lodash'
import { SentimentInput, SentimentInputs } from './SentimentInputs'
import z from 'zod'

const postSchema = z.object({
  content: z.string().trim().min(1, { message: 'Required' }),
  meetingId: z.string().uuid(),
  postId: z.string().uuid(),
  profileId: z.string().uuid(),
  sentiment: z.nativeEnum(Sentiment),
})

function parseFormData(event: FormEvent<HTMLFormElement>) {
  const formData = new FormData(event.currentTarget)
  return postSchema.safeParse(Object.fromEntries(formData.entries()))
}

export function CreatePostForm(props: {
  meetingId: string
  post?: PostWithAuthor
  profileId: string
}) {
  const [content, setContent] = useState(props.post?.content ?? '')
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false)
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(
    null
  )
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
    if (!selectedSentiment || !sentiment.result || content.trim().length > 0) {
      debouncedClassify(content)
    }
  }, [content, debouncedClassify, selectedSentiment, sentiment.result])

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = parseFormData(event)
    // TODO: Handle errors
    if (error) return
    event.currentTarget.reset()
    setContent('')
    setSelectedSentiment(null)
    await db.transact([
      db.tx.posts[data.postId].update({
        content: data.content,
        sentiment: data.sentiment,
      }),
      db.tx.posts[data.postId].link({
        author: data.profileId,
        // @ts-expect-error InstantDB typing is incorrect
        meeting: data.meetingId,
      }),
    ])
  }

  return (
    <form
      className={styles.form}
      onFocus={() => {
        if (isAuthor) setIsTextAreaFocused(true)
      }}
      onBlur={() => {
        if (isAuthor) setIsTextAreaFocused(false)
      }}
      onKeyDown={event => {
        if (event.metaKey && event.key === 'Enter') {
          event.currentTarget.requestSubmit()
        }
      }}
      onSubmit={isAuthor ? updatePost : createPost}
    >
      <input type="hidden" name="meetingId" value={props.meetingId} />
      <input type="hidden" name="postId" value={props.post?.id ?? id()} />
      <input type="hidden" name="profileId" value={props.profileId} />
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
        tabIndex={!props.post || isAuthor ? 0 : -1}
        value={isAuthor ? content : props.post?.content}
      />
      <footer>
        {props.post && !isDirty && !isTextAreaFocused ? (
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

async function updatePost(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const { data, error } = parseFormData(event)
  // TODO: Handle errors
  if (error) return
  await db.transact([
    db.tx.posts[data.postId].update({
      content: data.content,
      sentiment: data.sentiment,
    }),
    db.tx.posts[data.postId].link({
      author: data.profileId,
      // @ts-expect-error InstantDB typing is incorrect
      meeting: data.meetingId,
    }),
  ])
}
