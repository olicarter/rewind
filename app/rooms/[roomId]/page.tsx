'use client'

import { db, PostWithAuthor } from '@/app/db'
import styles from './page.module.css'
import { redirect, useParams as useNextParams } from 'next/navigation'
import { CreatePostForm } from './CreatePostForm'
import {
  getPresentUsers,
  parseSelectedProfileIds,
  PresentUsers,
} from './PresentUsers'
import { isEveryCharUppercase } from '@/utils'
import { Button } from '@/components/Button/Button'

export default function Room() {
  useAuth()
  const { roomId } = useParams()
  const { isHost, meeting, posts, profile, selectedProfileIds } = useData({
    roomId,
  })

  const room = db.room('retro', roomId)
  const presence = db.rooms.usePresence(room)
  db.rooms.useSyncPresence(room, {
    name: profile?.name,
    profileId: profile?.id,
  })

  if (!profile || !meeting) return null

  const postsOfSelectedProfiles = posts.filter(post => {
    if (selectedProfileIds.length === 0) return true
    return post.author && selectedProfileIds.includes(post.author.id)
  })

  return (
    <div className={styles.page}>
      <header>
        <PresentUsers
          isHost={isHost}
          meetingId={meeting.id}
          presentUsers={getPresentUsers(presence)}
          roomId={roomId}
          selectedProfileIds={parseSelectedProfileIds(
            meeting.selectedProfileIds
          )}
        />
        {isHost ? (
          <Button asChild disabled>
            <label>Host</label>
          </Button>
        ) : null}
      </header>
      <CreatePostForm meetingId={meeting.id} profileId={profile.id} />
      <main className={styles.main}>
        {postsOfSelectedProfiles.map(post => (
          <CreatePostForm
            key={post.id}
            meetingId={meeting.id}
            post={post}
            profileId={profile.id}
          />
        ))}
      </main>
    </div>
  )
}

function useData({ roomId }: { roomId: string }) {
  const auth = db.useAuth()

  const { data } = db.useQuery(
    auth.user
      ? {
          meetings: {
            $: { where: { roomId } },
            host: {},
            posts: { author: {} },
            profiles: {},
          },
          profiles: {
            $: { where: { $user: auth.user.id } },
          },
        }
      : null
  )

  const profile = data?.profiles.at(0)
  const meeting = data?.meetings.at(0)
  // InstantDB doesn't type the data correctly, so we need to cast it
  const posts: PostWithAuthor[] = meeting?.posts ?? []
  const isHost = meeting?.host?.id === profile?.id
  const selectedProfileIds = parseSelectedProfileIds(
    meeting?.selectedProfileIds
  )

  return { isHost, meeting, posts, profile, selectedProfileIds }
}

function useParams() {
  const params = useNextParams<{ roomId: string }>()

  if (!isEveryCharUppercase(params.roomId)) {
    redirect(`/rooms/${params.roomId.toUpperCase()}`)
  }

  return params
}

function useAuth() {
  const auth = db.useAuth()

  if (auth.user === null) redirect('/')
}
