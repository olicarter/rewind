'use client'

import { db, PostWithAuthor } from '@/app/db'
import { ChangeEvent, useCallback, useEffect } from 'react'
import styles from './CreatePostForm.module.css'
import { id } from '@instantdb/react'
import { Button } from '@/components/Button'
import { TextArea } from '@/components/TextArea'
import { Sentiment, useSentimentAnalyser } from '@/hooks/useSentimentAnalyser'
import { debounce } from 'lodash'
import { SentimentInputs } from './SentimentInputs'
import z from 'zod'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export type CreatePostFormData = z.infer<typeof postSchema>

const postSchema = z.object({
  content: z.string().trim().min(1, { message: 'Required' }),
  id: z.string().uuid(),
  sentiment: z.nativeEnum(Sentiment),
})

export function CreatePostForm(props: {
  meetingId: string
  post?: PostWithAuthor
  profileId: string
}) {
  const form = useForm<CreatePostFormData>({
    defaultValues: {
      content: props.post?.content ?? '',
      id: props.post?.id ?? id(),
      sentiment: props.post?.sentiment as Sentiment,
    },
    resolver: zodResolver(postSchema),
  })
  const { getFieldState, handleSubmit, register, reset } = form

  const isAuthor = props.post?.author?.id === props.profileId

  const sentiment = useSentimentAnalyser()

  const classifyContent = useCallback(debounce(sentiment.classify, 200), [
    sentiment.classify,
  ])

  useEffect(() => {
    if (props.post) {
      reset({
        content: props.post.content,
        id: props.post.id,
        sentiment: props.post.sentiment as Sentiment,
      })
    }
  }, [props.post, reset])

  useEffect(() => {
    if (!getFieldState('sentiment').isDirty && sentiment.result) {
      form.setValue('sentiment', sentiment.result.label)
    }
  }, [sentiment.result, form])

  async function createOrUpdatePost(data: CreatePostFormData) {
    await db.transact([
      db.tx.posts[data.id].update({
        content: data.content,
        sentiment: data.sentiment,
      }),
      ...(isAuthor
        ? []
        : [
            db.tx.posts[data.id].link({
              author: props.profileId,
              // @ts-expect-error InstantDB typing is incorrect
              meeting: props.meetingId,
            }),
          ]),
    ])
    reset()
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
        <TextArea
          {...register('content', {
            onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
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
          <div>
            <Buttons isAuthor={isAuthor} post={props.post} />
          </div>
        </footer>
      </form>
    </FormProvider>
  )
}

function Buttons(props: {
  isAuthor: boolean
  post: PostWithAuthor | undefined
}) {
  const {
    formState: { isDirty },
    reset,
  } = useFormContext<CreatePostFormData>()

  if (!props.post) return <Button>Create</Button>

  if (!props.isAuthor) return null

  if (isDirty) {
    return (
      <>
        <Button disabled={!isDirty} type="submit">
          Save
        </Button>
        <Button onClick={() => reset()} type="button">
          Cancel
        </Button>
      </>
    )
  }

  return <DeleteButton post={props.post} />
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
