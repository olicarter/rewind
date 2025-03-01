'use client'

import { CSSProperties, Fragment } from 'react'
import styles from './ColorInput.module.css'

export function ColorInput() {
  const length = 8

  return (
    <div className={styles.colors}>
      {Array.from({ length }).map((_, index) => (
        <Fragment key={index}>
          <input
            id={`color-${index}`}
            name="color"
            type="radio"
            value={index}
          />
          <label
            htmlFor={`color-${index}`}
            style={{ '--hue': (index * 360) / length } as CSSProperties}
          />
        </Fragment>
      ))}
    </div>
  )
}
