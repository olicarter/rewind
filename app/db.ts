import { InstaQLEntity, init } from '@instantdb/react'
import schema, { AppSchema } from '@/instant.schema'

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  devtool: false,
  schema,
})

export type PostWithAuthor = InstaQLEntity<AppSchema, 'posts', { author: {} }>
export type Profile = InstaQLEntity<AppSchema, 'profiles'>
export type Stage = 'intro' | 'discussion' | 'feedback' | 'conclusion'
