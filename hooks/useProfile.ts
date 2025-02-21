'use client'

import { db } from '@/app/db'

export function useProfile() {
  const auth = db.useAuth()

  const query = db.useQuery({
    profiles: { $: { where: { $user: auth.user?.id ?? '' } } },
  })

  if (auth.isLoading) {
    return { isLoading: true, profile: null }
  }

  const profile = query.data?.profiles.at(0)

  return { isLoading: false, profile: profile ?? null }
}
