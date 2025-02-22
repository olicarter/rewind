'use client'

import { db } from '@/app/db'
import { useEffect } from 'react'
import styles from './page.module.css'
import { redirect, useParams, useSearchParams } from 'next/navigation'
import { CreatePostForm } from './CreatePostForm'
import { PresentUsers } from './PresentUsers'

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const auth = db.useAuth()
  const selectedProfiles = searchParams.getAll('selected-profiles')
  const query = db.useQuery({
    posts: {
      $: {
        where: {
          ...(selectedProfiles.length
            ? { 'author.id': { $in: selectedProfiles } }
            : {}),
          roomId,
        },
      },
      author: {},
    },
    profiles: { $: { where: { $user: auth.user?.id ?? '' } } },
  })

  const profile = query.data?.profiles.at(0)
  const room = db.room('retro', roomId)
  const presence = db.rooms.usePresence(room)

  useEffect(() => {
    if (profile) {
      presence.publishPresence({
        name: profile.nickname,
        profileId: profile.id,
      })
    }
  }, [presence, profile])

  if (auth.user === null) {
    redirect('/')
  }

  if (!profile) {
    return null
  }

  return (
    <main className={styles.main}>
      <PresentUsers roomId={roomId} />
      <CreatePostForm roomId={roomId} profileId={profile.id} />
      <ul className={styles.posts}>
        {query.data?.posts.map(post => (
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
