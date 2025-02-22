import { i } from '@instantdb/react'

const _schema = i.schema({
  // We inferred 1 attribute!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    posts: i.entity({
      content: i.string(),
      createdAt: i.date(),
      roomId: i.string(),
      sentiment: i.string(),
    }),
    profiles: i.entity({
      createdAt: i.date(),
      nickname: i.string(),
    }),
  },
  links: {
    postsAuthor: {
      forward: {
        on: 'posts',
        has: 'one',
        label: 'author',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'authoredPosts',
      },
    },
    profiles$user: {
      forward: {
        on: 'profiles',
        has: 'one',
        label: '$user',
      },
      reverse: {
        on: '$users',
        has: 'one',
        label: 'profile',
      },
    },
  },
  rooms: {
    retro: {
      presence: i.entity({
        isHost: i.boolean(),
        name: i.string(),
        profileId: i.string(),
        // JSON serialized array of profile IDs
        selectedProfileIds: i.string(),
      }),
    },
  },
})

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
