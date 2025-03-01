'use client'

import { uniqBy } from 'lodash'
import { redirect, useParams as useNextParams } from 'next/navigation'
import { PostWithAuthor, db } from '@/app/db'
import { Button } from '@/components/Button/Button'
import { isEveryCharUppercase, isDefined } from '@/utils'
import { CreatePostForm } from './CreatePostForm'
import styles from './page.module.css'
import {
  PresentUsers,
  getPresentUsers,
  parseSelectedProfileIds,
} from './PresentUsers'
import { SignInPage } from '@/components/SignInPage/SignInPage'

export default function Room() {
  const auth = db.useAuth()
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

  if (auth.user === null) return <SignInPage />
  if (!profile || !meeting) return null

  const postsOfSelectedProfiles = posts.filter(post => {
    if (selectedProfileIds.length === 0) return true
    return post.author && selectedProfileIds.includes(post.author.id)
  })

  return (
    <div className={styles.page}>
      <header>
        <div>
          {isHost ? (
            <Button asChild className={styles.hostButton} disabled>
              <label>Host</label>
            </Button>
          ) : null}
          <PresentUsers
            authors={uniqBy(
              posts.map(post => post.author).filter(isDefined),
              'id'
            )}
            isHost={isHost}
            meetingId={meeting.id}
            presentProfiles={getPresentUsers(presence).map(presentUser => ({
              id: presentUser.profileId,
              name: presentUser.name,
            }))}
            roomId={roomId}
            selectedProfileIds={parseSelectedProfileIds(
              meeting.selectedProfileIds
            )}
          />
        </div>
        <Button onClick={() => db.auth.signOut()} type="button">
          Leave
        </Button>
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
