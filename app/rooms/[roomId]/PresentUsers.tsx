'use client'

import { db } from '@/app/db'
import styles from './PresentUsers.module.css'
import { ChangeEvent, Fragment } from 'react'
import { Button } from '@/components/Button'

interface PresenceUser {
  name: string
  peerId: string | undefined
  profileId: string
}

export function PresentUsers(props: {
  isHost: boolean
  meetingId: string
  presentUsers: PresenceUser[]
  roomId: string
  selectedProfileIds: string[]
}) {
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

  return (
    <ul className={styles.presentUsers}>
      {props.presentUsers.map(presentUser => (
        <Fragment key={presentUser.peerId}>
          <input
            checked={props.selectedProfileIds.includes(presentUser.profileId)}
            className={styles.input}
            id={presentUser.peerId}
            onChange={event =>
              toggleSelectedProfile(event, presentUser.profileId)
            }
            readOnly={!props.isHost}
            type="checkbox"
          />
          <Button asChild className={styles.button}>
            <label htmlFor={presentUser.peerId}>{presentUser.name}</label>
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
