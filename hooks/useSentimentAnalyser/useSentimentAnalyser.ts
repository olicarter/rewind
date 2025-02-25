import { useState, useRef, useEffect, useCallback } from 'react'

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export interface SentimentResult {
  label: Sentiment
  score: number
}

export function useSentimentAnalyser() {
  const [result, setResult] = useState<SentimentResult | null>(null)
  const [ready, setReady] = useState<boolean | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    async function initWorker() {
      if (!workerRef.current && typeof window !== 'undefined') {
        workerRef.current = new Worker(new URL('./worker.js', import.meta.url))
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
          const output = e.data.output[0]
          if (output) {
            // This is the score threshold for the model to classify a sentiment as neutral.
            // Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english
            const threshold = 0.88
            setResult({
              label:
                output.score < threshold ? Sentiment.NEUTRAL : output.label,
              score: output.score,
            })
          } else {
            setResult(null)
          }
          break
      }
    }

    // Attach the callback function as an event listener.
    workerRef.current?.addEventListener('message', onMessageReceived)

    // Define a cleanup function for when the component is unmounted.
    return () =>
      workerRef.current?.removeEventListener('message', onMessageReceived)
  })

  const classify = useCallback((text: string) => {
    if (workerRef.current) {
      console.log('classify', text)
      workerRef.current.postMessage({ text })
    }
  }, [])

  return { classify, ready, result }
}
