'use client'

import { db } from '@/app/db'
import { useEffect } from 'react'
import styles from './page.module.css'
import { Button } from '@/components/Button'
import { Post } from './Post'
import { useParams } from 'next/navigation'
import { CreatePostForm } from './CreatePostForm'

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

  useEffect(() => {
    if (profile) {
      presence.publishPresence({ name: profile.nickname })
    }
  }, [presence, profile])

  if (!profile) {
    return null
  }

  return (
    <main className={styles.main}>
      <PresentUsers roomId={roomId} />
      <CreatePostForm roomId={roomId} profileId={profile.id} />
      <ul className={styles.postList}>
        {query.data?.posts.map(post => (
          <Post key={post.id} post={post} profile={profile} />
        ))}
      </ul>
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
        <Button asChild key={presence.peerId}>
          <p>{presence.name}</p>
        </Button>
      ))}
    </div>
  )
}

function isDefinedAndHasPeerId<
  T extends { peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId
}
