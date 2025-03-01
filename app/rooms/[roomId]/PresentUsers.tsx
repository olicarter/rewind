'use client'

import { ChangeEvent, Fragment } from 'react'
import { db, Profile } from '@/app/db'
import { Button } from '@/components/Button'
import styles from './PresentUsers.module.css'
import { uniqBy } from 'lodash'

export interface PresentUsersProps {
  authors: Pick<Profile, 'id' | 'name'>[]
  isHost: boolean
  meetingId: string
  presentProfiles: Pick<Profile, 'id' | 'name'>[]
  roomId: string
  selectedProfileIds: string[]
}

export function PresentUsers(props: PresentUsersProps) {
  function toggleSelectedProfile(
    event: ChangeEvent<HTMLInputElement>,
    profileId: string
  ) {
    if (!props.isHost) return

    const newSelectedProfileIds = new Set(props.selectedProfileIds)

    if (event.currentTarget.checked) {
      newSelectedProfileIds.add(profileId)
    } else {
      newSelectedProfileIds.delete(profileId)
    }

    db.transact([
      db.tx.meetings[props.meetingId].update({
        selectedProfileIds: JSON.stringify(Array.from(newSelectedProfileIds)),
      }),
    ])
  }

  const allProfiles = uniqBy([...props.presentProfiles, ...props.authors], 'id')

  return (
    <ul className={styles.presentUsers}>
      {allProfiles.map(profile => (
        <Fragment key={profile.id}>
          <input
            checked={props.selectedProfileIds.includes(profile.id)}
            className={styles.input}
            id={profile.id}
            onChange={event => toggleSelectedProfile(event, profile.id)}
            readOnly={!props.isHost}
            type="checkbox"
          />
          <Button asChild className={styles.button}>
            <label htmlFor={profile.id}>{profile.name}</label>
          </Button>
        </Fragment>
      ))}
    </ul>
  )
}

export function parseSelectedProfileIds(
  selectedProfileIds: string | undefined
): string[] {
  return JSON.parse(selectedProfileIds ?? '[]')
}

interface PresenceUser {
  name: string
  peerId: string | undefined
  profileId: string
}

export function getPresentUsers<
  Presence extends {
    user?: PresenceUser
    peers: Record<string, PresenceUser>
  }
>(presence: Presence) {
  return [presence.user, ...Object.values(presence.peers)]
    .filter(isDefinedAndHasPeerId)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function isDefinedAndHasPeerId<
  T extends { name: string | undefined; peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId && !!presence.name
}
