import { useState, useRef, useEffect, useCallback } from 'react'

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
}

export interface SentimentResult {
  label: Sentiment
  score: number
}

export function useSentiment() {
  const [result, setResult] = useState<SentimentResult | null>(null)
  const [ready, setReady] = useState<boolean | null>(null)
  const worker = useRef<Worker | null>(null)

  useEffect(() => {
    async function initWorker() {
      if (!worker.current && typeof window !== 'undefined') {
        worker.current = new Worker(new URL('./worker.js', import.meta.url))
      }
    }
    initWorker()

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e: MessageEvent) => {
      switch (e.data.status) {
        case 'initiate':
          setReady(false)
          break
        case 'ready':
          setReady(true)
          break
        case 'complete':
          setResult(e.data.output[0])
          break
      }
    }

    // Attach the callback function as an event listener.
    worker.current?.addEventListener('message', onMessageReceived)

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current?.removeEventListener('message', onMessageReceived)
  })

  const classify = useCallback((text: string) => {
    if (worker.current) {
      worker.current.postMessage({ text })
    }
  }, [])

  return { classify, ready, result }
}
