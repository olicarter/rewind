import { DndContext, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { id } from '@instantdb/react'
import { groupBy } from 'lodash'
import { registerMasonry } from 'masonry-pf'
import { ChangeEvent, useMemo, useState } from 'react'
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
import { Post } from './Post'
import styles from './Posts.module.css'

export interface PostsProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
  selectedProfileIds: string[]
}

export function Posts(props: PostsProps) {
  const postsToDisplay = useMemo(() => {
    if (!props.meeting?.stage) return []

    switch (props.meeting.stage) {
      case Stage.Intro:
        return props.posts.filter(post => post.author?.id === props.profile?.id)
      case Stage.Group:
      case Stage.Discussion:
        if (props.selectedProfileIds.length === 0) return props.posts
        return props.posts.filter(post => {
          return (
            post.author && props.selectedProfileIds.includes(post.author.id)
          )
        })
      default:
        return []
    }
  }, [
    props.meeting?.stage,
    props.posts,
    props.profile?.id,
    props.selectedProfileIds,
  ])

  if ([Stage.Group, Stage.Discussion].includes(props.meeting.stage)) {
    return (
      <DndContext
        modifiers={[restrictToWindowEdges]}
        onDragEnd={async event => {
          const dragPostId = event.active.id
          const dragGroupId = event.active.data.current?.groupId
          const dropType = event.over?.data.current?.type
          const dropId = event.over?.id.toString()

          // If the post is being dropped on itself, do nothing
          if (!dropId || dragPostId === dropId) return

          // If the post is being dropped on the background, remove it from any group
          if (dropType === 'posts' && dragGroupId) {
            // Don't do anything if the group has only one post
            if (
              props.posts.filter(post => post.group?.id === dragGroupId)
                .length === 1
            ) {
              return
            }

            // Create a new group and add the post to it
            const newGroupId = id()
            await db.transact([
              db.tx.posts[dragPostId].unlink({ group: dragGroupId }),
              db.tx.groups[newGroupId].update({ name: 'Group' }),
              db.tx.posts[dragPostId].link({ group: newGroupId }),
            ])

            // If the group is now empty, delete it
            if (
              !props.posts.filter(post => post.group?.id === dragGroupId).length
            ) {
              await db.transact([db.tx.groups[dragGroupId].delete()])
            }
          }

          // If the post is being dropped on a post, create a new group and add both posts to it
          if (dropType === 'post') {
            const groupId = id()
            db.transact([
              db.tx.groups[groupId].update({ name: 'Group' }),
              db.tx.posts[dragPostId].link({ group: groupId }),
              db.tx.posts[dropId].link({ group: groupId }),
            ])
          }

          // If the post is being dropped on a group, add the post to the group
          if (dropType === 'group') {
            db.transact([
              ...(props.posts.filter(post => post.group?.id === dragGroupId)
                .length === 1
                ? [db.tx.groups[dragGroupId].delete()]
                : []),
              db.tx.posts[dragPostId].link({ group: dropId }),
            ])
          }
        }}
      >
        <GroupPostsList
          meeting={props.meeting}
          posts={postsToDisplay}
          profile={props.profile}
        />
      </DndContext>
    )
  }

  return (
    <ul className={styles.posts} ref={registerMasonry}>
      {postsToDisplay.map(post => (
        <Post
          key={post.id}
          meetingId={props.meeting.id}
          meetingStage={props.meeting.stage}
          post={post}
          profile={props.profile}
        />
      ))}
    </ul>
  )
}

interface GroupPostsListProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function GroupPostsList(props: GroupPostsListProps) {
  const droppable = useDroppable({
    id: 'posts',
    data: { type: 'posts' },
  })

  const groupedPostsByGroupId = useMemo(() => {
    const postsWithGroup = props.posts.filter(post => !!post.group?.id)
    return groupBy(postsWithGroup, post => post.group?.id)
  }, [props.posts])

  const ungroupedPosts = useMemo(() => {
    return props.posts.filter(post => !post.group?.id)
  }, [props.posts])

  return (
    <ul
      className={styles.posts}
      ref={element => {
        droppable.setNodeRef(element)
        if (!droppable.active) registerMasonry(element)
      }}
    >
      {Object.entries(groupedPostsByGroupId).map(([groupId, posts]) => {
        const group = posts.at(0)?.group
        if (!group) return null
        return (
          <Group
            group={group}
            key={groupId}
            meeting={props.meeting}
            posts={posts}
            profile={props.profile}
          />
        )
      })}
      {ungroupedPosts.map(post => (
        <Post
          key={post.id}
          meetingId={props.meeting.id}
          meetingStage={props.meeting.stage}
          post={post}
          profile={props.profile}
        />
      ))}
    </ul>
  )
}

interface GroupProps {
  group: Group
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function Group(props: GroupProps) {
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
    await db.transact([db.tx.groups[props.group.id].update({ name })])
  }

  return (
    <li
      className={styles.group}
      id={id}
      ref={droppable.setNodeRef}
      style={{
        opacity: droppable.isOver && !isDraggingPostInGroup ? 0.5 : 1,
      }}
    >
      <header className={styles.header}>
        <TextInput
          className={styles.groupName}
          defaultValue={props.group.name}
          onChange={updateGroupName}
          readOnly={props.meeting.stage !== Stage.Group}
        />
        {props.meeting.stage === Stage.Discussion && (
          <Button
            className={styles.voteButton}
            onClick={toggleVote}
            type="button"
          >
            {props.group.votedBy?.includes(props.profile.id)
              ? 'Unvote'
              : 'Vote'}
          </Button>
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
