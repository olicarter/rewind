import { DndContext, useDroppable } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { id } from '@instantdb/react'
import { groupBy, uniqBy } from 'lodash'
import { Masonry } from 'react-plock'
import { useMemo, useRef, useState } from 'react'
import { db, Meeting, PostWithAuthor, Profile, Stage } from '@/app/db'
import { RadioButton } from '@/components/RadioButton'
import { Group } from './Group'
import { Post } from './Post'
import styles from './Posts.module.css'

// Breakpoints derived from minmax(24rem, 1fr) auto-fill behaviour:
// N columns need N×384px + (N-1)×16px + 32px page padding.
//   2 cols → 816px,  3 cols → 1216px,  4 cols → 1616px,  5 cols → 2016px
// The trailing duplicate satisfies react-plock's media.length >= columns.length rule.
const MASONRY_CONFIG = {
  columns: [1, 2, 3, 4, 5],
  gap: [16, 16, 16, 16, 16],
  media: [816, 1216, 1616, 2016, 2016],
  useBalancedLayout: true,
}

// The feedback masonry runs inside a sub-container that is (N-1)/N of the
// full viewport width (aside takes one outer column), so it fits one fewer
// column than MASONRY_CONFIG at each breakpoint.
const FEEDBACK_MASONRY_CONFIG = {
  columns: [1, 1, 2, 3, 4],
  gap: [16, 16, 16, 16, 16],
  media: [816, 1216, 1616, 2016, 2016],
  useBalancedLayout: true,
}

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
          sortByVotes
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
        sortByVotes
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

  // Stage.Intro — only the current user's own posts
  const introPostMap = new Map(postsToDisplay.map(p => [p.id, p]))
  return (
    <Masonry
      className={styles.posts}
      items={postsToDisplay.map(p => p.id)}
      render={postId => {
        const post = introPostMap.get(postId)
        if (!post) return null
        return (
          <Post
            meetingId={props.meeting.id}
            meetingStage={props.meeting.stage}
            post={post}
            profile={props.profile}
          />
        )
      }}
      config={MASONRY_CONFIG}
    />
  )
}

interface GroupPostsProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
  sortByVotes?: boolean
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

  const postById = useMemo(
    () => new Map(ungroupedPosts.map(p => [p.id, p])),
    [ungroupedPosts]
  )

  // Stable order ref: only re-sort when the set of item keys changes,
  // not when votes change — prevents masonry reordering on vote toggles.
  const stableOrderRef = useRef<string[]>([])

  // String IDs are used as masonry items so react-plock's useBalancedLayout
  // height Map survives re-renders without reference-equality issues.
  const items = useMemo(() => {
    const groupItems = Object.keys(groupedPostsByGroupId).map(gid => ({
      key: `group:${gid}`,
      votes: JSON.parse(
        groupedPostsByGroupId[gid]?.at(0)?.group?.votedBy ?? '[]'
      ).length,
      createdAt: groupedPostsByGroupId[gid]?.at(0)?.group?.createdAt ?? 0,
    }))

    const postItems = ungroupedPosts.map(p => ({
      key: `post:${p.id}`,
      votes: JSON.parse(p.votedBy ?? '[]').length,
      createdAt: p.createdAt ?? 0,
    }))

    const all = [...groupItems, ...postItems]

    // Only re-sort when items are added or removed, not when votes change
    const newKeySet = new Set(all.map(item => item.key))
    const oldKeySet = new Set(stableOrderRef.current)
    const keysChanged =
      newKeySet.size !== oldKeySet.size ||
      [...newKeySet].some(k => !oldKeySet.has(k))

    if (keysChanged) {
      all.sort(
        (a, b) =>
          b.votes - a.votes || Number(a.createdAt) - Number(b.createdAt)
      )
      stableOrderRef.current = all.map(item => item.key)
    }

    return stableOrderRef.current
  }, [groupedPostsByGroupId, ungroupedPosts, props.sortByVotes])

  return (
    // Wrapper carries the DnD droppable ref for "drop on background" detection.
    <div className={styles.posts} ref={droppable.setNodeRef}>
      <Masonry
        items={items}
        render={item => {
          if (item.startsWith('group:')) {
            const groupId = item.slice(6)
            const posts = groupedPostsByGroupId[groupId]
            const group = posts?.at(0)?.group
            if (!group) return null
            return (
              <Group
                group={group}
                meeting={props.meeting}
                posts={posts}
                profile={props.profile}
              />
            )
          }
          const postId = item.slice(5)
          const post = postById.get(postId)
          if (!post) return null
          return (
            <Post
              meetingId={props.meeting.id}
              meetingStage={props.meeting.stage}
              post={post}
              profile={props.profile}
            />
          )
        }}
        config={MASONRY_CONFIG}
      />
    </div>
  )
}

interface FeedbackPostsProps {
  meeting: Meeting
  posts: PostWithAuthor[]
  profile: Profile
}

function FeedbackPosts(props: FeedbackPostsProps) {
  const ungroupedPosts = props.posts.filter(post => !post.group?.id)

  const stableSidebarOrderRef = useRef<string[]>([])

  const sidebarItems = useMemo(() => {
    const groupItems = uniqBy(
      props.posts.flatMap(post => post.group ?? []),
      'id'
    ).map(group => ({
      type: 'group' as const,
      id: `group:${group.id}`,
      group,
      votes: JSON.parse(group.votedBy ?? '[]').length,
    }))

    const postItems = ungroupedPosts.map(post => ({
      type: 'post' as const,
      id: `post:${post.id}`,
      post,
      votes: JSON.parse(post.votedBy ?? '[]').length,
    }))

    const all = [...groupItems, ...postItems]

    // Only re-sort when items are added or removed, not when votes change
    const newKeySet = new Set(all.map(item => item.id))
    const oldKeySet = new Set(stableSidebarOrderRef.current)
    const keysChanged =
      newKeySet.size !== oldKeySet.size ||
      [...newKeySet].some(k => !oldKeySet.has(k))

    if (keysChanged) {
      all.sort((a, b) => b.votes - a.votes)
      stableSidebarOrderRef.current = all.map(item => item.id)
      return all
    }

    // Return items in the stable order
    const itemById = new Map(all.map(item => [item.id, item]))
    return stableSidebarOrderRef.current
      .map(id => itemById.get(id))
      .filter(Boolean) as typeof all
  }, [props.posts, ungroupedPosts])

  const firstItem = sidebarItems.at(0)
  const firstGroupId =
    firstItem?.type === 'group' ? firstItem.group.id : null
  const firstUngroupedPostId =
    firstItem?.type === 'post' ? firstItem.post.id : null

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    firstGroupId
  )
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    firstUngroupedPostId
  )

  function selectGroup(groupId: string) {
    setSelectedGroupId(groupId)
    setSelectedPostId(null)
  }

  function selectPost(postId: string) {
    setSelectedPostId(postId)
    setSelectedGroupId(null)
  }

  const postById = useMemo(
    () => new Map(props.posts.map(p => [p.id, p])),
    [props.posts]
  )

  const feedbackItems = useMemo(() => {
    if (selectedGroupId) {
      return props.posts
        .filter(p => p.group?.id === selectedGroupId)
        .map(p => p.id)
    }
    if (selectedPostId) {
      return props.posts.filter(p => p.id === selectedPostId).map(p => p.id)
    }
    return []
  }, [selectedGroupId, selectedPostId, props.posts])

  return (
    <div className={styles.feedbackPosts}>
      <aside>
        <div className="groupCard">
          <h2 className="groupCardTitle">Topics</h2>
          {sidebarItems.map(item =>
            item.type === 'group' ? (
              <RadioButton
                checked={selectedGroupId === item.group.id}
                key={item.group.id}
                onChange={() => selectGroup(item.group.id)}
              >
                {item.group.name}
                <span className={styles.voteCount}>{item.votes} votes</span>
              </RadioButton>
            ) : (
              <RadioButton
                checked={selectedPostId === item.post.id}
                key={item.post.id}
                onChange={() => selectPost(item.post.id)}
              >
                {item.post.content}
                <span className={styles.voteCount}>{item.votes} votes</span>
              </RadioButton>
            )
          )}
        </div>
      </aside>
      <Masonry
        className={styles.feedbackPostsMain}
        config={FEEDBACK_MASONRY_CONFIG}
        items={feedbackItems}
        render={postId => {
          const post = postById.get(postId)
          if (!post) return null
          return (
            <Post
              meetingId={props.meeting.id}
              meetingStage={props.meeting.stage}
              post={post}
              profile={props.profile}
            />
          )
        }}
      />
    </div>
  )
}
