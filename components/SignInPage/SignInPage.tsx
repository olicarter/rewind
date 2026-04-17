'use client'

import { useState } from 'react'
import { db } from '@/app/db'
import { Button } from '../Button'
import * as Form from '../Form'
import { TextInput } from '../TextInput'
import styles from './SignInPage.module.css'

export function SignInPage() {
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await db.auth.sendMagicCode({ email })
      setCodeSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await db.auth.signInWithMagicCode({ email, code })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      {!codeSent ? (
        <Form.Root className={styles.form} onSubmit={sendCode}>
<Form.Field>
            <Form.Label htmlFor="email">Email</Form.Label>
            <TextInput
              autoComplete="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </Form.Field>
          {error && <p className={styles.error}>{error}</p>}
          <Button disabled={loading}>
            {loading ? 'Sending…' : 'Send code'}
          </Button>
        </Form.Root>
      ) : (
        <Form.Root className={styles.form} onSubmit={verifyCode}>
<p className={styles.hint}>
            We sent a code to <strong>{email}</strong>
          </p>
          <Form.Field>
            <Form.Label htmlFor="code">Magic code</Form.Label>
            <TextInput
              autoComplete="one-time-code"
              className={styles.codeInput}
              id="code"
              onChange={(e) => setCode(e.target.value)}
              placeholder="——————"
              required
              value={code}
            />
          </Form.Field>
          {error && <p className={styles.error}>{error}</p>}
          <Button disabled={loading}>
            {loading ? 'Verifying…' : 'Sign in'}
          </Button>
          <button
            className={styles.back}
            onClick={() => { setCodeSent(false); setCode(''); setError(null) }}
            type="button"
          >
            Use a different email
          </button>
        </Form.Root>
      )}
    </main>
  )
}
