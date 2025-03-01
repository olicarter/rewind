'use server'

import { id } from '@instantdb/react'
import { db } from '@/app/db'

export async function submitPost(formData: FormData) {
  const content = formData.get('content') as string

  db.transact(
    db.tx.posts[id()].update({
      content,
    }),
  )
}
