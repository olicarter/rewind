'use client'

import { uniqBy } from 'lodash'
import { redirect, useParams } from 'next/navigation'
import { useMemo } from 'react'
import { Meeting, PostWithAuthor, Stage, db, stageLabels } from '@/app/db'
import { Button } from '@/components/Button/Button'
import { SignInPage } from '@/components/SignInPage/SignInPage'
import { isEveryCharUppercase, isDefined, cn } from '@/utils'
import { CreatePostForm } from './CreatePostForm'
import styles from './page.module.css'
import { Post } from './Post'
import {
  PresentUsers,
  getPresentUsers,
  parseSelectedProfileIds,
} from './PresentUsers'

export default function Room() {
  const auth = db.useAuth()
  const { roomId } = useParams<{ roomId: string }>()

  // Redirect to the uppercase version of the room ID
  if (!isEveryCharUppercase(roomId)) redirect(`/rooms/${roomId.toUpperCase()}`)

  const { authors, hostId, meeting, posts, profile, selectedProfileIds } =
    useData({ roomId })

  const room = db.room('retro', roomId)
  const presence = db.rooms.usePresence(room)

  db.rooms.useSyncPresence(room, {
    name: profile?.name,
    profileId: profile?.id,
  })

  const postsToDisplay = useMemo(() => {
    if (!meeting?.stage) return []

    switch (meeting.stage) {
      case Stage.Intro:
        return posts.filter(post => post.author?.id === profile?.id)
      case Stage.Discussion:
        return posts.filter(post => {
          if (selectedProfileIds.length === 0) return true
          return post.author && selectedProfileIds.includes(post.author.id)
        })
      default:
        return []
    }
  }, [meeting?.stage, posts, profile?.id, selectedProfileIds])

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
          <Stages id={meeting.id} stage={meeting.stage} />
          <hr className={styles.divider} />
          <PresentUsers
            authors={meeting.stage === Stage.Discussion ? authors : []}
            hostId={hostId}
            isHost={hostId === profile.id}
            meetingId={meeting.id}
            meetingStage={meeting.stage as Stage}
            presentProfiles={presentProfiles}
            roomId={roomId}
            selectedProfileIds={selectedProfileIds}
          />
        </div>
        <div>
          <Button onClick={() => db.auth.signOut()} type="button">
            Leave
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        {meeting.stage === Stage.Intro && (
          <CreatePostForm meetingId={meeting.id} profileId={profile.id} />
        )}
        <ul className={styles.posts}>
          {postsToDisplay.map(post => (
            <Post
              key={post.id}
              meetingId={meeting.id}
              post={post}
              profileId={profile.id}
            />
          ))}
        </ul>
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
  const authors = uniqBy(posts.map(post => post.author).filter(isDefined), 'id')
  const hostId = meeting?.host?.id
  const selectedProfileIds = parseSelectedProfileIds(
    meeting?.selectedProfileIds
  )

  return {
    authors,
    hostId,
    meeting,
    posts,
    profile,
    selectedProfileIds,
  }
}

function Stages(props: Pick<Meeting, 'id' | 'stage'>) {
  async function setStage(stage: Stage) {
    db.transact([db.tx.meetings[props.id].update({ stage })])
  }

  return (
    <ol className={styles.stages}>
      {Object.values(Stage).map(stage => (
        <li
          className={cn(styles.stage, props.stage === stage && styles.active)}
          key={stage}
        >
          <Button onClick={() => setStage(stage)}>{stageLabels[stage]}</Button>
        </li>
      ))}
    </ol>
  )
}
