'use client'

import { User, id } from '@instantdb/react'
import { useRouter } from 'next/navigation'
import { FormEvent } from 'react'
import { Button } from '@/components/Button'
import * as Form from '@/components/Form'
import { TextInput } from '@/components/TextInput'
import { db } from './db'
import styles from './page.module.css'

export default function Home() {
  const auth = db.useAuth()

  if (auth.isLoading) {
    return null
  }

  if (!auth.user) {
    return (
      <main className={styles.main}>
        <SignInForm />
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <JoinRoomForm user={auth.user} />
    </main>
  )
}

function SignInForm() {
  const url = db.auth.createAuthorizationURL({
    clientName: 'google',
    redirectURL: window.location.href,
  })

  return (
    <Button asChild>
      <a href={url}>Continue with Google</a>
    </Button>
  )
}

function JoinRoomForm(props: { user: User }) {
  const router = useRouter()

  const query = db.useQuery({
    profiles: { $: { where: { $user: props.user.id } }, $user: {} },
  })

  if (!query.data) {
    return null
  }

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const roomCode = (formData.get('code') as string).toUpperCase()
    const profileId = query.data?.profiles.at(0)?.id ?? id()
    const { data } = await db.queryOnce({
      meetings: {
        $: { where: { roomId: roomCode } },
      },
    })
    const meeting = data?.meetings.at(0)
    const meetingId = meeting?.id ?? id()
    await db.transact([
      db.tx.profiles[profileId].update({ name }),
      db.tx.profiles[profileId].link({ $user: props.user.id }),
      db.tx.meetings[meetingId].update({ roomId: roomCode }),
      db.tx.meetings[meetingId].link({ host: profileId }),
    ])
    router.push(`/rooms/${roomCode}`)
  }

  return (
    <Form.Root className={styles.form} onSubmit={joinRoom}>
      <Form.Field>
        <Form.Label>Name</Form.Label>
        <TextInput
          autoComplete="off"
          defaultValue={query.data.profiles.at(0)?.name}
          name="name"
          required
        />
      </Form.Field>
      <Form.Field>
        <Form.Label htmlFor="code">Room code</Form.Label>
        <TextInput
          autoComplete="off"
          className={styles.codeInput}
          id="code"
          maxLength={4}
          minLength={4}
          name="code"
          required
        />
      </Form.Field>
      <Button>Join</Button>
    </Form.Root>
  )
}
