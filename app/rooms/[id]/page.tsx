'use client'

import { db } from '@/app/db'
import styles from './page.module.css'
import { redirect, useParams } from 'next/navigation'
import { CreatePostForm } from './CreatePostForm'
import {
  getHostsSelectedProfileIds,
  parseSelectedProfileIds,
  PresentUsers,
} from './PresentUsers'

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>()

  if (!isEveryCharUppercase(roomId)) {
    redirect(`/rooms/${roomId.toUpperCase()}`)
  }

  const room = db.room('retro', roomId)
  const auth = db.useAuth()
  const presence = db.rooms.usePresence(room)
  const userSelectedProfileIds = parseSelectedProfileIds(
    presence.user?.selectedProfileIds
  )
  const hostsSelectedProfileIds = getHostsSelectedProfileIds(presence)
  const selectedProfileIds =
    hostsSelectedProfileIds.length > 0
      ? hostsSelectedProfileIds
      : userSelectedProfileIds.length > 0
      ? userSelectedProfileIds
      : []

  const { data } = db.useQuery({
    posts: {
      $: {
        where: {
          ...(selectedProfileIds.length
            ? { 'author.id': { $in: selectedProfileIds } }
            : {}),
          roomId,
        },
      },
      author: {},
    },
    profiles: { $: { where: { $user: auth.user?.id ?? '' } } },
  })

  const profile = data?.profiles.at(0)

  db.rooms.useSyncPresence(room, {
    name: profile?.nickname,
    profileId: profile?.id,
    isHost: Object.values(presence.peers).every(peer => !peer.isHost),
  })

  if (auth.user === null) {
    redirect('/')
  }

  if (!profile) {
    return null
  }

  return (
    <main className={styles.main}>
      <header>
        <PresentUsers roomId={roomId} />
        {presence.user?.isHost ? <span>Host</span> : null}
      </header>
      <CreatePostForm roomId={roomId} profileId={profile.id} />
      <ul className={styles.posts}>
        {data?.posts.map(post => (
          <CreatePostForm
            key={post.id}
            post={post}
            profileId={profile.id}
            roomId={roomId}
          />
        ))}
      </ul>
    </main>
  )
}

function isEveryCharUppercase(value: string) {
  return value.split('').every(char => char.toUpperCase() === char)
}
