import { db } from '@/app/db'
import { Button } from '../Button'
import styles from './SignInPage.module.css'

export function SignInPage() {
  const url = db.auth.createAuthorizationURL({
    clientName: 'google',
    redirectURL: window.location.href,
  })

  return (
    <main className={styles.main}>
      <Button asChild>
        <a href={url}>Enter with Google</a>
      </Button>
    </main>
  )
}
