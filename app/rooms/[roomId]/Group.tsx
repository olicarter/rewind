import { useDroppable } from '@dnd-kit/core'
import { ChangeEvent, useState } from 'react'
import {
  db,
  type Group,
  Meeting,
  PostWithAuthor,
  Profile,
  Stage,
} from '@/app/db'
import { Button } from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import styles from './Group.module.css'
import { Post } from './Post'

export interface GroupProps {
  group: Group
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

export function Group(props: GroupProps) {
  const [uuid] = useState(() => crypto.randomUUID())

  const id = props.group.id || uuid

  const droppable = useDroppable({ id, data: { type: 'group' } })

  const isDraggingPostInGroup = props.posts.some(
    post => post.id === droppable.active?.id
  )

  async function toggleVote() {
    const votedBy = new Set<string>(JSON.parse(props.group.votedBy ?? '[]'))
    const newVotedBy = votedBy.has(props.profile.id)
      ? Array.from(votedBy).filter(id => id !== props.profile.id)
      : [...votedBy, props.profile.id]
    await db.transact([
      db.tx.groups[props.group.id].update({
        votedBy: JSON.stringify(newVotedBy),
      }),
    ])
  }

  async function updateGroupName(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.value
    await db.transact(db.tx.groups[props.group.id].update({ name }))
  }

  return (
    <li
      className={`groupCard ${styles.group}`}
      id={id}
      ref={droppable.setNodeRef}
      style={{
        opacity: droppable.isOver && !isDraggingPostInGroup ? 0.5 : 1,
      }}
    >
      <header className={styles.header}>
        <TextInput
          className={styles.groupName}
          onChange={updateGroupName}
          readOnly={props.meeting.stage !== Stage.Group}
          value={props.group.name}
        />
        {(props.meeting.stage === Stage.Discussion || props.meeting.stage === Stage.Group) && (
          <Button
            className={styles.voteButton}
            onClick={props.meeting.stage === Stage.Discussion ? toggleVote : undefined}
            style={props.meeting.stage === Stage.Group ? { visibility: 'hidden' } : undefined}
            type="button"
          >
            {props.group.votedBy?.includes(props.profile.id)
              ? 'Unvote'
              : 'Vote'}
          </Button>
        )}
        {props.meeting.stage === Stage.Feedback && (
          <label className="button">
            {JSON.parse(props.group.votedBy ?? '[]').length} votes
          </label>
        )}
      </header>
      <ul>
        {props.posts.map(post => (
          <Post
            key={post.id}
            meetingId={props.meeting.id}
            meetingStage={props.meeting.stage}
            post={post}
            profile={props.profile}
          />
        ))}
      </ul>
    </li>
  )
}
