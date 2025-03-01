'use client'

import { uniqBy } from 'lodash'
import { ChangeEvent, Fragment } from 'react'
import { db, Presence, Profile, Stage } from '@/app/db'
import { cn } from '@/utils'
import styles from './PresentUsers.module.css'

export interface PresentUsersProps {
  authors: Pick<Profile, 'id' | 'name'>[]
  hostId: string | undefined
  isHost: boolean
  meetingId: string
  meetingStage: Stage
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

  const allProfiles = uniqBy(
    [
      ...props.presentProfiles.map(p => ({ ...p, present: true })),
      ...props.authors.map(p => ({ ...p, present: false })),
    ],
    'id'
  ).sort((a, b) => a.name.localeCompare(b.name))

  const readOnly = !props.isHost || props.meetingStage !== Stage.Discussion

  return (
    <ul className={styles.presentUsers}>
      {allProfiles.map(profile => (
        <Fragment key={profile.id}>
          <input
            checked={props.selectedProfileIds.includes(profile.id)}
            className={styles.input}
            id={profile.id}
            onChange={event =>
              !readOnly && toggleSelectedProfile(event, profile.id)
            }
            readOnly={readOnly}
            type="checkbox"
          />
          <label
            className={cn(
              'button',
              styles.label,
              props.hostId === profile.id && styles.host,
              !profile.present && styles.offline
            )}
            htmlFor={profile.id}
          >
            {props.hostId === profile.id && <span>Host</span>}
            {profile.name}
          </label>
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

export function getPresentUsers<P extends Presence>(presence: P) {
  return [presence.user, ...Object.values(presence.peers)]
    .filter(isDefinedAndHasPeerId)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function isDefinedAndHasPeerId<
  T extends { name: string | undefined; peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId && !!presence.name
}
