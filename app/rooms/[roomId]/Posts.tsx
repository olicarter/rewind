import { DndContext, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { id } from '@instantdb/react'
import { groupBy, uniqBy } from 'lodash'
import { registerMasonry } from 'masonry-pf'
import { useMemo, useState } from 'react'
import { db, Meeting, PostWithAuthor, Profile, Stage } from '@/app/db'
import { RadioButton } from '@/components/RadioButton'
import { Group } from './Group'
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
      case Stage.Feedback:
        return props.posts
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
      <DndContext
        modifiers={[restrictToWindowEdges]}
        onDragEnd={async event => {
          const dragPostId = event.active.id
          const dragGroupId = event.active.data.current?.groupId
          const dropType = event.over?.data.current?.type
          const dropId = event.over?.id.toString()

          // If the post is being dropped on itself, do nothing
          if (!dropId || dragPostId === dropId) return

          const newGroupId = id()

          const postsInDragGroup = props.posts.filter(
            post => post.group?.id === dragGroupId
          )

          // If the post is being dropped on the background
          if (dropType === 'posts' && dragGroupId) {
            // Remove the post from the group and create a new group
            const actions = [
              db.tx.posts[dragPostId].unlink({ group: dragGroupId }),
            ]

            // If the group is now empty, delete it
            if (postsInDragGroup.length === 0) {
              actions.push(db.tx.groups[dragGroupId].delete())
            }

            await db.transact(actions)
          }

          // If the post is being dropped on a post
          if (dropType === 'post') {
            // Create a new group and add both posts to it
            await db.transact([
              db.tx.groups[newGroupId].update({ name: 'Group' }),
              db.tx.posts[dragPostId].link({ group: newGroupId }),
              db.tx.posts[dropId].link({ group: newGroupId }),
            ])
          }

          // If the post is being dropped on a group
          if (dropType === 'group') {
            // Add the post to the group
            const actions = [db.tx.posts[dragPostId].link({ group: dropId })]

            // If the old group is empty, delete it
            if (
              dragGroupId &&
              postsInDragGroup.length === 1 &&
              dragGroupId !== dropId
            ) {
              actions.push(db.tx.groups[dragGroupId].delete())
            }

            await db.transact(actions)
          }
        }}
      >
        <GroupPosts
          meeting={props.meeting}
          posts={postsToDisplay}
          profile={props.profile}
        />
      </DndContext>
    )
  }

  if (props.meeting.stage === Stage.Discussion) {
    return (
      <GroupPosts
        meeting={props.meeting}
        posts={postsToDisplay}
        profile={props.profile}
      />
    )
  }

  if (props.meeting.stage === Stage.Feedback) {
    return (
      <FeedbackPosts
        meeting={props.meeting}
        posts={postsToDisplay}
        profile={props.profile}
      />
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

interface GroupPostsProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function GroupPosts(props: GroupPostsProps) {
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

interface FeedbackPostsProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function FeedbackPosts(props: FeedbackPostsProps) {
  const postsSortedByGroupWithMostVotes = props.posts.sort((a, b) => {
    const aVotes = JSON.parse(a.group?.votedBy ?? '[]').length
    const bVotes = JSON.parse(b.group?.votedBy ?? '[]').length
    return bVotes - aVotes
  })

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    postsSortedByGroupWithMostVotes.at(0)?.group?.id ?? null
  )

  const uniqueGroups = uniqBy(
    props.posts.flatMap(post => post.group ?? []),
    'id'
  )

  return (
    <div className={styles.feedbackPosts}>
      <aside>
        {uniqueGroups.map(group => (
          <RadioButton
            checked={selectedGroupId === group.id}
            key={group.id}
            onChange={() => setSelectedGroupId(group.id)}
            size="large"
          >
            {group.name}
            <span className={styles.voteCount}>
              {JSON.parse(group.votedBy ?? '[]').length} votes
            </span>
          </RadioButton>
        ))}
      </aside>
      <ul ref={registerMasonry}>
        {selectedGroupId &&
          postsSortedByGroupWithMostVotes
            .filter(post => post.group?.id === selectedGroupId)
            .map(post => {
              const group = post.group

              if (!group) return null

              return (
                <Post
                  key={post.id}
                  meetingId={props.meeting.id}
                  meetingStage={props.meeting.stage}
                  post={post}
                  profile={props.profile}
                />
              )
            })}
      </ul>
    </div>
  )
}
