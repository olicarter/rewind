import { DndContext } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useMemo } from 'react'
import { Meeting, PostWithAuthor, Profile, Stage } from '@/app/db'
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

  return (
    <DndContext modifiers={[restrictToWindowEdges]}>
      <ul className={styles.posts}>
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
    </DndContext>
  )
}
