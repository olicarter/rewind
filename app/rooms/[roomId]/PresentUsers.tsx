'use client'

import { uniqBy } from 'lodash'
import { ChangeEvent } from 'react'
import { db, Presence, Profile, Stage } from '@/app/db'
import { CheckboxButton } from '@/components/CheckboxButton/CheckboxButton'
import { useKeyDown } from '@/hooks/useKeyDown'
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
  const isShiftKeyDown = useKeyDown('Shift')

  function toggleSelectedProfile(
    event: ChangeEvent<HTMLInputElement>,
    profileId: string
  ) {
    if (!props.isHost) return

    const newSelectedProfileIds = new Set(
      props.selectedProfileIds.length > 1 || isShiftKeyDown
        ? props.selectedProfileIds
        : []
    )

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
  ).sort((a, b) => {
    // Host comes first
    if (a.id === props.hostId) return -1
    if (b.id === props.hostId) return 1
    // Otherwise sort alphabetically by name
    return a.name.localeCompare(b.name)
  })

  const readOnly =
    !props.isHost ||
    ![Stage.Group, Stage.Discussion].includes(props.meetingStage)

  return (
    <ul className={styles.presentUsers}>
      {allProfiles.map(profile => (
        <CheckboxButton
          checked={props.selectedProfileIds.includes(profile.id)}
          className={cn(
            'medium',
            styles.label,
            props.hostId === profile.id && styles.host,
            !profile.present && styles.offline
          )}
          key={profile.id}
          onChange={event => toggleSelectedProfile(event, profile.id)}
          readOnly={readOnly}
        >
          {props.hostId === profile.id && <span>Host</span>}
          {profile.name}
        </CheckboxButton>
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
