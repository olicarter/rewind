'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { User, id } from '@instantdb/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/Button'
import * as Form from '@/components/Form'
import { SignInPage } from '@/components/SignInPage/SignInPage'
import { TextInput } from '@/components/TextInput'
import { db } from './db'
import styles from './page.module.css'

export default function Home() {
  const auth = db.useAuth()

  if (auth.isLoading) return null
  if (!auth.user) return <SignInPage />

  return (
    <main className={styles.main}>
      <JoinRoomForm user={auth.user} />
    </main>
  )
}

const joinRoomSchema = z.object({
  roomId: z.string().length(4).toUpperCase(),
  name: z.string().min(1),
  userId: z.string().uuid(),
})

type FormValues = z.infer<typeof joinRoomSchema>

function JoinRoomForm(props: { user: User }) {
  const router = useRouter()

  const query = db.useQuery({
    profiles: { $: { where: { $user: props.user.id } }, $user: {} },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { name: '', roomId: '', userId: props.user.id },
  })
  const { register, handleSubmit, setValue } = form

  const name = query.data?.profiles.at(0)?.name

  useEffect(() => {
    if (name) setValue('name', name)
  }, [name, setValue])

  async function joinRoom(formData: FormValues) {
    const query = await db.queryOnce({
      meetings: { $: { where: { roomId: formData.roomId } } },
      profiles: { $: { where: { $user: formData.userId } }, $user: {} },
    })
    const meeting = query.data?.meetings.at(0)
    const meetingId = meeting?.id ?? id()
    const profileId = query.data?.profiles.at(0)?.id ?? id()
    try {
      await db.transact([
        db.tx.profiles[profileId].update({ name: formData.name }),
        db.tx.profiles[profileId].link({ $user: formData.userId }),
        db.tx.meetings[meetingId].update({
          roomId: formData.roomId,
          stage: meeting?.stage ?? 'intro',
        }),
        db.tx.meetings[meetingId].link({ host: profileId }),
      ])
      router.push(`/rooms/${formData.roomId}`)
    } catch (error) {
      // TODO: Handle error
      console.error(error)
    }
  }

  return (
    <Form.Root className={styles.form} onSubmit={handleSubmit(joinRoom)}>
      <input type="hidden" {...register('userId')} />
      <Form.Field>
        <Form.Label>Name</Form.Label>
        <TextInput {...register('name')} autoComplete="off" />
      </Form.Field>
      <Form.Field>
        <Form.Label htmlFor="roomId">Room code</Form.Label>
        <TextInput
          {...register('roomId')}
          autoComplete="off"
          className={styles.codeInput}
          id="roomId"
          maxLength={4}
          minLength={4}
        />
      </Form.Field>
      <Button>Join</Button>
    </Form.Root>
  )
}
