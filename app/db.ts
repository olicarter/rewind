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

export interface PresenceUser {
  name: string
  peerId: string | undefined
  profileId: string
}

export interface Presence {
  user?: PresenceUser
  peers: Record<string, PresenceUser>
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export const sentimentLabels: Record<Sentiment, string> = {
  [Sentiment.POSITIVE]: 'Good',
  [Sentiment.NEGATIVE]: 'Bad',
  [Sentiment.NEUTRAL]: 'Mixed',
}

export enum Stage {
  Intro = 'intro',
  Group = 'group',
  Discussion = 'discussion',
  Feedback = 'feedback',
}

export const stageLabels: Record<Stage, string> = {
  [Stage.Intro]: 'Share',
  [Stage.Group]: 'Group',
  [Stage.Discussion]: 'Vote',
  [Stage.Feedback]: 'Discuss',
}
