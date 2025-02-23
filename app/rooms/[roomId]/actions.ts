'use server'

import { db } from '@/app/db'
import { id } from '@instantdb/react'

export async function submitPost(formData: FormData) {
  const content = formData.get('content') as string

  db.transact(
    db.tx.posts[id()].update({
      content,
    }),
  )
}
