'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { id } from '@instantdb/react'
import { debounce } from 'lodash'
import { ChangeEvent, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { PostWithAuthor, Sentiment, db } from '@/app/db'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import { useSentimentAnalyser } from '@/hooks/useSentimentAnalyser'
import styles from './CreatePostForm.module.css'
import { SentimentInputs } from './SentimentInputs'

export type CreatePostFormData = z.infer<typeof postSchema>

const postSchema = z.object({
  content: z.string().trim().min(1, { message: 'Required' }),
  id: z.string().uuid().optional(),
  sentiment: z.nativeEnum(Sentiment).nullable(),
})

export function CreatePostForm(props: {
  meetingId: string
  onCancel?: () => void
  onSave?: () => void
  post?: PostWithAuthor
  profileId: string
}) {
  const form = useForm<CreatePostFormData>({
    defaultValues: {
      content: props.post?.content ?? '',
      id: props.post?.id,
      sentiment: (props.post?.sentiment as Sentiment) ?? null,
    },
    resolver: zodResolver(postSchema),
  })
  const { getFieldState, handleSubmit, register, reset, setValue } = form

  // Use the local worker to analyse the sentiment of the post.
  const sentiment = useSentimentAnalyser()

  // Debounce the sentiment analysis to avoid calling the local worker too often.
  const classifyContent = debounce(sentiment.classify, 200)

  // Reset the form values to the post values.
  useEffect(() => {
    if (props.post) {
      reset({
        content: props.post.content,
        id: props.post.id,
        sentiment: props.post.sentiment as Sentiment,
      })
    }
  }, [props.post, reset])

  // Set the sentiment of the post to the result of the sentiment analysis.
  useEffect(() => {
    if (!getFieldState('sentiment').isDirty && sentiment.result) {
      setValue('sentiment', sentiment.result.label)
    }
  }, [getFieldState, sentiment.result, setValue])

  // Check if the current user is the author of the post.
  const isAuthor = props.post?.author?.id === props.profileId

  // Create or update a post.
  async function createOrUpdatePost(data: CreatePostFormData) {
    const postId = data.id ?? id()
    await db.transact([
      db.tx.posts[postId].update({
        content: data.content,
        sentiment: data.sentiment ?? undefined,
      }),
      ...(isAuthor
        ? []
        : [
            db.tx.posts[postId].link({
              author: props.profileId,
              // @ts-expect-error InstantDB typing is incorrect
              meeting: props.meetingId,
            }),
          ]),
    ])
    reset()
    props.onSave?.()
  }

  // Cancel the form.
  function cancel() {
    props.onCancel?.()
  }

  return (
    <FormProvider {...form}>
      <form
        className={styles.form}
        onKeyDown={event => {
          if (event.metaKey && event.key === 'Enter') {
            event.currentTarget.requestSubmit()
          }
        }}
        onSubmit={handleSubmit(createOrUpdatePost)}
      >
        {props.post && (
          <header className={styles.header}>
            <Avatar name={props.post.author?.name ?? ''} size="small" />
            <h4 className={styles.heading}>{props.post.author?.name}</h4>
          </header>
        )}
        <TextArea
          {...register('content', {
            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
              if (!event.target.value.length) {
                form.setValue('sentiment', null)
              }
              if (!getFieldState('sentiment').isDirty) {
                classifyContent(event.target.value)
              }
            },
          })}
          placeholder="What's on your mind?"
          readOnly={props.post && !isAuthor}
          required
          tabIndex={!props.post ? 0 : -1}
        />
        <footer>
          <SentimentInputs />
          {props.post ? (
            <div>
              <Button>Save</Button>
              <Button onClick={cancel} type="button">
                Cancel
              </Button>
            </div>
          ) : (
            <Button>Create</Button>
          )}
        </footer>
      </form>
    </FormProvider>
  )
}
