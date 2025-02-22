import { SentimentResult, Sentiment } from '@/hooks/useSentiment/useSentiment'
import { Fragment, useMemo } from 'react'
import styles from './SentimentInput.module.css'

interface SentimentInputProps {
  onChange: (value: Sentiment) => void
  sentiment: SentimentResult | null
  value: Sentiment | null
}

export function SentimentInput(props: SentimentInputProps) {
  const computedValue = useMemo(() => {
    if (props.value || !props.sentiment) {
      return props.value
    }

    if (props.sentiment.score < 0.99) {
      return Sentiment.NEUTRAL
    }

    return props.sentiment.label
  }, [props.value, props.sentiment])

  return (
    <div className={styles.inputs}>
      {Object.values(Sentiment).map(sentiment => (
        <Fragment key={sentiment}>
          <input
            checked={computedValue === sentiment}
            id={sentiment}
            name="sentiment"
            onChange={event => {
              props.onChange(event.target.value as Sentiment)
            }}
            type="radio"
            value={sentiment}
          />
          <label
            className={styles[sentiment.toLowerCase()]}
            htmlFor={sentiment}
          >
            {sentiment.toLowerCase()}
          </label>
        </Fragment>
      ))}
    </div>
  )
}
