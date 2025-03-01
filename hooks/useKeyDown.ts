import { useEffect, useState } from 'react'

export function useKeyDown(key: string) {
  const [isDown, setIsDown] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        setIsDown(true)
      }
    }

    const handleKeyUp = () => setIsDown(false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [key])

  return isDown
}
