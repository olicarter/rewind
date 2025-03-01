import { InstaQLEntity, init } from '@instantdb/react'
import schema, { AppSchema } from '@/instant.schema'

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  devtool: false,
  schema,
})

export type Meeting = InstaQLEntity<AppSchema, 'meetings'>
export type PostWithAuthor = InstaQLEntity<AppSchema, 'posts', { author: {} }>
export type Profile = InstaQLEntity<AppSchema, 'profiles'>

export enum Stage {
  Intro = 'intro',
  Discussion = 'discussion',
  Feedback = 'feedback',
}

export const stageLabels = {
  [Stage.Intro]: 'Share',
  [Stage.Discussion]: 'Vote',
  [Stage.Feedback]: 'Discuss',
}
