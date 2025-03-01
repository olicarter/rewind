'use client'

import { uniqBy } from 'lodash'
import { redirect, useParams as useNextParams } from 'next/navigation'
import { Meeting, PostWithAuthor, Stage, db, stageLabels } from '@/app/db'
import { Button } from '@/components/Button/Button'
import { SignInPage } from '@/components/SignInPage/SignInPage'
import { isEveryCharUppercase, isDefined, cn } from '@/utils'
import { CreatePostForm } from './CreatePostForm'
import styles from './page.module.css'
import {
  PresentUsers,
  getPresentUsers,
  parseSelectedProfileIds,
} from './PresentUsers'

export default function Room() {
  const auth = db.useAuth()
  const { roomId } = useParams()
  const { authors, hostId, meeting, posts, profile, selectedProfileIds } =
    useData({
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

  const presentProfiles = getPresentUsers(presence).map(presentUser => ({
    id: presentUser.profileId,
    name: presentUser.name,
  }))

  const postsOfSelectedProfiles = posts.filter(post => {
    if (selectedProfileIds.length === 0) return true
    return post.author && selectedProfileIds.includes(post.author.id)
  })

  return (
    <div className={styles.page}>
      <header>
        <div>
          <Stages stage={meeting.stage} />
          <hr className={styles.divider} />
          <PresentUsers
            authors={authors}
            hostId={hostId}
            isHost={hostId === profile.id}
            meetingId={meeting.id}
            presentProfiles={presentProfiles}
            roomId={roomId}
            selectedProfileIds={parseSelectedProfileIds(
              meeting.selectedProfileIds
            )}
          />
        </div>
        <div>
          <Button onClick={() => db.auth.signOut()} type="button">
            Leave
          </Button>
        </div>
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

function useParams() {
  const params = useNextParams<{ roomId: string }>()

  if (!isEveryCharUppercase(params.roomId)) {
    redirect(`/rooms/${params.roomId.toUpperCase()}`)
  }

  return params
}

function Stages(props: Pick<Meeting, 'stage'>) {
  return (
    <ol className={styles.stages}>
      {Object.values(Stage).map(stage => (
        <li
          className={cn(styles.stage, props.stage === stage && styles.active)}
          key={stage}
        >
          <Button asChild disabled>
            <label>{stageLabels[stage]}</label>
          </Button>
        </li>
      ))}
    </ol>
  )
}
