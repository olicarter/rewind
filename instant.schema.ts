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
    groups: i.entity({
      createdAt: i.date(),
      name: i.string(),
      // JSON serialized array of profile IDs
      votedBy: i.string(),
    }),
    posts: i.entity({
      content: i.string(),
      createdAt: i.date(),
      sentiment: i.string(),
      // JSON serialized array of profile IDs
      votedBy: i.string(),
    }),
    profiles: i.entity({
      createdAt: i.date(),
      name: i.string(),
    }),
    meetings: i.entity({
      roomId: i.string().unique().indexed(),
      createdAt: i.date(),
      // JSON serialized array of profile IDs
      selectedProfileIds: i.string(),
      stage: i.string(),
    }),
  },
  links: {
    meetingsHost: {
      forward: {
        on: 'meetings',
        has: 'one',
        label: 'host',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'hostedMeetings',
      },
    },
    meetingsPosts: {
      forward: {
        on: 'posts',
        has: 'many',
        label: 'posts',
      },
      reverse: {
        on: 'meetings',
        has: 'one',
        label: 'meeting',
      },
    },
    meetingsProfiles: {
      forward: {
        on: 'meetings',
        has: 'many',
        label: 'profiles',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'meetings',
      },
    },
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
    postsGroup: {
      forward: {
        on: 'posts',
        has: 'one',
        label: 'group',
      },
      reverse: {
        on: 'groups',
        has: 'many',
        label: 'posts',
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
        name: i.string(),
        profileId: i.string(),
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
