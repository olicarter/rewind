// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react'

const rules = {
  attrs: {
    allow: {
      create: 'true',
      $default: 'false',
    },
  },
} satisfies InstantRules

export default rules
