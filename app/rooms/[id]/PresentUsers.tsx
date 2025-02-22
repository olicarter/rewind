'use client'

import { db } from '@/app/db'
import styles from './PresentUsers.module.css'
import { Fragment } from 'react'

export function PresentUsers(props: { roomId: string }) {
  const room = db.room('retro', props.roomId)
  const presence = db.rooms.usePresence(room)

  const presentUsers = getPresentUsers(presence)
  const hostsSelectedProfileIds = getHostsSelectedProfileIds(presence)
  const isHost = !!presence.user?.isHost

  return (
    <ul className={styles.presentUsers}>
      {presentUsers.map(presentUser => (
        <Fragment key={presentUser.peerId}>
          <input
            checked={hostsSelectedProfileIds.includes(presentUser.profileId)}
            className={styles.input}
            id={presentUser.peerId}
            onChange={event => {
              if (!isHost) return

              const newSelectedProfileIds = new Set(hostsSelectedProfileIds)

              if (event.currentTarget.checked) {
                newSelectedProfileIds.add(presentUser.profileId)
              } else {
                newSelectedProfileIds.delete(presentUser.profileId)
              }

              presence.publishPresence({
                selectedProfileIds: JSON.stringify(
                  Array.from(newSelectedProfileIds)
                ),
              })
            }}
            readOnly={!isHost}
            type="checkbox"
          />
          <label className={styles.label} htmlFor={presentUser.peerId}>
            {presentUser.name}
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

export function getHostsSelectedProfileIds<
  PresenceUser extends {
    isHost: boolean
    name: string
    peerId: string | undefined
    profileId: string
    selectedProfileIds: string
  },
  Presence extends {
    user?: PresenceUser
    peers: Record<string, PresenceUser>
  }
>(presence: Presence): string[] {
  const presentUsers = getPresentUsers(presence)

  return presentUsers.flatMap(presentUser =>
    presentUser.isHost ? JSON.parse(presentUser.selectedProfileIds ?? '[]') : []
  )
}

export function getPresentUsers<
  PresenceUser extends {
    isHost: boolean
    name: string
    peerId: string | undefined
    profileId: string
    selectedProfileIds: string
  },
  Presence extends {
    user?: PresenceUser
    peers: Record<string, PresenceUser>
  }
>(presence: Presence) {
  return [presence.user, ...Object.values(presence.peers)].filter(
    isDefinedAndHasPeerId
  )
}

function isDefinedAndHasPeerId<
  T extends { peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId
}
