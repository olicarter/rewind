'use client'

import { db } from '@/app/db'
import styles from './PresentUsers.module.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PresentUsers(props: { roomId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const room = db.room('retro', props.roomId)
  const presence = db.rooms.usePresence(room)

  const presentUsers = [presence.user, ...Object.values(presence.peers)].filter(
    isDefinedAndHasPeerId
  )

  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    searchParams.getAll('selected-profiles')
  )

  return (
    <ul className={styles.presentUsers}>
      {presentUsers.map(presentUser => (
        <label className={styles.label} key={presentUser.peerId}>
          <input
            checked={selectedProfiles.includes(presentUser.profileId)}
            onChange={event => {
              const newSelectedProfiles = event.currentTarget.checked
                ? [...selectedProfiles, presentUser.profileId]
                : selectedProfiles.filter(
                    user => user !== presentUser.profileId
                  )

              setSelectedProfiles(newSelectedProfiles)
              const newSearchParams = new URLSearchParams(searchParams)
              if (newSelectedProfiles.length === 0) {
                newSearchParams.delete('selected-profiles')
              } else {
                newSelectedProfiles.forEach(user =>
                  newSearchParams.append('selected-profiles', user)
                )
              }
              router.replace(
                `/rooms/${props.roomId}?${newSearchParams.toString()}`
              )
            }}
            type="checkbox"
          />
          {presentUser.name}
        </label>
      ))}
    </ul>
  )
}

function isDefinedAndHasPeerId<
  T extends { peerId: string | undefined } | undefined
>(presence: T): presence is T & { peerId: string } {
  return !!presence && !!presence.peerId
}
