import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { groupBy } from 'lodash'
import { registerMasonry } from 'masonry-pf'
import { useMemo, useState } from 'react'
import { db, Meeting, PostWithAuthor, Profile, Stage } from '@/app/db'
import { cn } from '@/utils'
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
        return props.posts
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

  if (props.meeting.stage === Stage.Group) {
    return (
      <DndContext modifiers={[restrictToWindowEdges]} onDragEnd={handleDragEnd}>
        <GroupPostsList
          meeting={props.meeting}
          posts={props.posts}
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
          meetingStage={props.meeting.stage as Stage}
          post={post}
          profile={props.profile}
        />
      ))}
    </ul>
  )
}

function handleDragEnd(event: DragEndEvent) {
  const dragPostId = event.active.id
  const dropType = event.over?.data.current?.type
  const dropId = event.over?.id.toString()

  // If the post is being dropped on itself, do nothing
  if (!dropId || dragPostId === dropId) return

  // If the post is being dropped on the background, remove it from any group
  if (dropType === 'posts') {
    db.transact([db.tx.posts[dragPostId].update({ groupId: undefined })])
  }

  // If the post is being dropped on a post, create a new group and add both posts to it
  if (dropType === 'post') {
    const randomString = `Foo ${Math.random()}`
    db.transact([
      db.tx.posts[dragPostId].update({ groupId: randomString }),
      db.tx.posts[dropId].update({ groupId: randomString }),
    ])
  }

  // If the post is being dropped on a group, add the post to the group
  if (dropType === 'group') {
    db.transact([db.tx.posts[dragPostId].update({ groupId: dropId })])
  }
}

interface GroupPostsListProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function GroupPostsList(props: GroupPostsListProps) {
  const droppable = useDroppable({ id: 'posts', data: { type: 'posts' } })

  const groupedPostsByGroupId = useMemo(() => {
    const postsWithGroup = props.posts.filter(post => !!post.groupId)
    return groupBy(postsWithGroup, 'groupId')
  }, [props.posts])

  const ungroupedPosts = useMemo(() => {
    return props.posts.filter(post => !post.groupId)
  }, [props.posts])

  return (
    <ul
      className={styles.posts}
      ref={element => {
        droppable.setNodeRef(element)
        if (!droppable.active) registerMasonry(element)
      }}
    >
      {Object.entries(groupedPostsByGroupId).map(([groupId, posts]) => (
        <Group
          groupId={groupId}
          key={groupId}
          meeting={props.meeting}
          posts={posts}
          profile={props.profile}
        />
      ))}
      {ungroupedPosts.map(post => (
        <Post
          key={post.id}
          meetingId={props.meeting.id}
          meetingStage={props.meeting.stage as Stage}
          post={post}
          profile={props.profile}
        />
      ))}
    </ul>
  )
}

interface GroupProps {
  groupId?: string
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function Group(props: GroupProps) {
  const [uuid] = useState(() => crypto.randomUUID())
  const id = props.groupId || uuid

  const droppable = useDroppable({ id, data: { type: 'group' } })

  const isDraggingPostInGroup = props.posts.some(
    post => post.id === droppable.active?.id
  )

  return (
    <li
      className={cn(
        styles.group,
        props.posts.length > 1 && styles.hasMultiplePosts
      )}
      id={id}
      ref={droppable.setNodeRef}
      style={{
        opacity: droppable.isOver && !isDraggingPostInGroup ? 0.5 : 1,
      }}
    >
      <ul>
        {props.posts.map(post => (
          <Post
            key={post.id}
            meetingId={props.meeting.id}
            meetingStage={props.meeting.stage as Stage}
            post={post}
            profile={props.profile}
          />
        ))}
      </ul>
    </li>
  )
}
