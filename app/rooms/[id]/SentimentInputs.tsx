import { SentimentResult, Sentiment } from '@/hooks/useSentimentAnalyser'
import styles from './SentimentInputs.module.css'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface SentimentInputsProps {
  onChange: (value: Sentiment) => void
  analyzedSentiment: SentimentResult | null
  selectedSentiment: Sentiment | null
}

export function SentimentInputs(props: SentimentInputsProps) {
  const [uuid] = useState(crypto.randomUUID())
  const value =
    props.selectedSentiment ?? props.analyzedSentiment?.label ?? null

  return (
    <div className={styles.inputs}>
      {Object.values(Sentiment).map(sentiment => (
        <SentimentInput
          key={sentiment}
          id={`${sentiment}-${uuid}`}
          label={sentiment}
          onChange={props.onChange}
          value={value}
        />
      ))}
    </div>
  )
}

interface SentimentInputProps {
  id: string
  label: Sentiment
  onChange: (value: Sentiment) => void
  tabIndex?: number
  value: Sentiment | null
}

export function SentimentInput(props: SentimentInputProps) {
  return (
    <>
      <input
        checked={props.value === props.label}
        className={styles.input}
        id={props.id}
        name="sentiment"
        onChange={event => {
          props.onChange(event.target.value as Sentiment)
        }}
        required
        tabIndex={props.tabIndex}
        type="radio"
        value={props.label}
      />
      <label
        className={cn(styles.label, styles[props.label.toLowerCase()])}
        htmlFor={props.id}
      >
        {props.label.toLowerCase()}
      </label>
    </>
  )
}
