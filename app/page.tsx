'use client'

import { FormEvent } from 'react'
import styles from './page.module.css'
import { db } from './db'
import { useRouter } from 'next/navigation'
import { id, User } from '@instantdb/react'
import { Button } from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import * as Form from '@/components/Form'

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
      {/* <Button type="button" onClick={() => db.auth.signOut()}>
        Sign out
      </Button> */}
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

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nickname = formData.get('nickname') as string
    const roomCode = formData.get('code') as string
    const profileId = query.data?.profiles.at(0)?.id ?? id()
    db.transact([
      db.tx.profiles[profileId].update({ nickname }),
      db.tx.profiles[profileId].link({ $user: props.user.id }),
    ])
    router.push(`/rooms/${roomCode}`)
  }

  return (
    <Form.Root className={styles.form} onSubmit={joinRoom}>
      <Form.Field>
        <Form.Label>Name</Form.Label>
        <TextInput
          defaultValue={query.data.profiles.at(0)?.nickname}
          name="nickname"
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
