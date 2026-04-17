'use client'

import { uniqBy } from 'lodash'
import { redirect, useParams, useRouter } from 'next/navigation'
import { Meeting, PostWithAuthor, Stage, db } from '@/app/db'
import { Button } from '@/components/Button/Button'
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { SignInPage } from '@/components/SignInPage/SignInPage'
import { isEveryCharUppercase, isDefined } from '@/utils'
import { CreatePostForm } from './CreatePostForm'
import styles from './page.module.css'
import { Posts } from './Posts'
import {
  PresentUsers,
  getPresentUsers,
  parseSelectedProfileIds,
} from './PresentUsers'
import { Stages } from './Stages'
export default function Room() {
  const auth = db.useAuth()
  const router = useRouter()
  const { roomId } = useParams<{ roomId: string }>()

  // Redirect to the uppercase version of the room ID
  if (!isEveryCharUppercase(roomId)) redirect(`/rooms/${roomId.toUpperCase()}`)

  const {
    authors,
    hostId,
    isHost,
    meeting,
    posts,
    profile,
    selectedProfileIds,
  } = useData({ roomId })

  const room = db.room('retro', roomId)
  const presence = db.rooms.usePresence(room)

  db.rooms.useSyncPresence(room, {
    name: profile?.name,
    profileId: profile?.id,
  })

  if (auth.user === null) return <SignInPage />
  if (!profile || !meeting) return null

  const presentProfiles = getPresentUsers(presence).map(presentUser => ({
    id: presentUser.profileId,
    name: presentUser.name,
  }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Stages
            isHost={isHost}
            meetingId={meeting.id}
            meetingStage={meeting.stage}
          />
          <hr className={styles.divider} />
          <PresentUsers
            authors={authors}
            hostId={hostId}
            isHost={isHost}
            meetingId={meeting.id}
            meetingStage={meeting.stage}
            presentProfiles={presentProfiles}
            roomId={roomId}
            selectedProfileIds={selectedProfileIds}
          />
        </div>
        <div className={styles.actions}>
          <ThemeToggle />
          <Button onClick={() => router.push('/')} type="button">
            Leave
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        {meeting.stage === Stage.Intro && (
          <div className="groupCard">
            <h2 className="groupCardTitle">Share</h2>
            <CreatePostForm meetingId={meeting.id} profile={profile} />
          </div>
        )}
        <Posts
          meeting={meeting}
          posts={posts}
          profile={profile}
          selectedProfileIds={selectedProfileIds}
        />
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
            posts: { author: {}, group: {} },
            profiles: {},
          },
          profiles: {
            $: { where: { $user: auth.user.id } },
          },
        }
      : null
  )

  const profile = data?.profiles.at(0)
  const meeting = data?.meetings.at(0) as Meeting
  // InstantDB doesn't type the data correctly, so we need to cast it
  const posts: PostWithAuthor[] = meeting?.posts ?? []
  const authors = uniqBy(posts.map(post => post.author).filter(isDefined), 'id')
  const hostId = meeting?.host?.id
  const selectedProfileIds = parseSelectedProfileIds(
    meeting?.selectedProfileIds
  )

  return {
    authors,
    hostId,
    isHost: hostId === profile?.id,
    meeting,
    posts,
    profile,
    selectedProfileIds,
  }
}
