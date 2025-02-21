'use client'

import { db } from '@/app/db'
import { FormEvent, useEffect, useState, useCallback, useRef } from 'react'
import styles from './page.module.css'
import { id } from '@instantdb/react'
import { Button } from '@/components/Button'
import { Post } from './Post'
import { TextArea } from '@/components/TextArea'
import { useParams } from 'next/navigation'
import {
  Sentiment,
  SentimentResult,
  useSentiment,
} from '@/hooks/useSentiment/useSentiment'
import { debounce } from 'lodash'

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>()
  const auth = db.useAuth()
  const query = db.useQuery({
    posts: {
      $: { where: { roomId } },
      author: {},
    },
    profiles: { $: { where: { $user: auth.user?.id ?? '' } } },
  })

  const profile = query.data?.profiles.at(0)
  const room = db.room('retro', roomId)
  const presence = db.rooms.usePresence(room)

  const sentiment = useSentiment()

  const debouncedClassify = useCallback(
    debounce((text: string) => {
      console.log('foo')
      sentiment.classify(text)
    }, 200),
    [sentiment]
  )

  useEffect(() => {
    // Cleanup debounced function on unmount
    return () => debouncedClassify.cancel()
  }, [debouncedClassify])

  useEffect(() => {
    if (profile) {
      presence.publishPresence({ name: profile.nickname })
    }
  }, [presence.publishPresence, profile?.nickname])

  if (!profile) {
    return null
  }

  function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const content = formData.get('content') as string
    const postId = id()
    db.transact([
      db.tx.posts[postId].update({
        content,
        roomId,
        sentiment: sentiment.result?.label,
      }),
      db.tx.posts[postId].link({ author: profile?.id }),
    ])
    event.currentTarget.reset()
  }

  return (
    <main className={styles.main}>
      <PresentUsers roomId={roomId} />
      <div className={styles.columns}>
        <section>
          <h3>What went well</h3>
          <form
            className={styles.form}
            onKeyDown={event => {
              if (event.metaKey && event.key === 'Enter') {
                event.currentTarget.requestSubmit()
              }
            }}
            onSubmit={createPost}
          >
            <TextArea
              name="content"
              onChange={event => debouncedClassify(event.target.value)}
              required
            />
            <SentimentInputs sentiment={sentiment.result} />
            <Button type="button">Create post</Button>
          </form>
          <ul className={styles.postList}>
            {query.data?.posts.map(post => (
              <Post key={post.id} post={post} profile={profile} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

function PresentUsers(props: { roomId: string }) {
  const room = db.room('retro', props.roomId)

  const presence = db.rooms.usePresence(room)

  const presentUsers = [presence.user, ...Object.values(presence.peers)].filter(
    isDefinedAndHasPeerId
  )

  return (
    <div className={styles.presenceList}>
      {presentUsers.map(presence => (
        <Button key={presence.peerId}>{presence.name}</Button>
      ))}
    </div>
  )
}

function isDefinedAndHasPeerId<
  T extends { peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId
}

function SentimentInputs(props: { sentiment: SentimentResult | null }) {
  const [value, setValue] = useState<Sentiment | null>(null)
  console.log(props.sentiment)

  return (
    <div className={styles.sentimentInputs}>
      <input
        checked={(value ?? props.sentiment?.label) === Sentiment.POSITIVE}
        type="radio"
        name="sentiment"
        value={Sentiment.POSITIVE}
        onChange={event => setValue(event.target.value as Sentiment.POSITIVE)}
      />
      <label className={styles.positive}>Positive</label>
      <input
        checked={(value ?? props.sentiment?.label) === Sentiment.NEGATIVE}
        type="radio"
        name="sentiment"
        value={Sentiment.NEGATIVE}
        onChange={event => setValue(event.target.value as Sentiment.NEGATIVE)}
      />
      <label className={styles.negative}>Negative</label>
    </div>
  )
}
