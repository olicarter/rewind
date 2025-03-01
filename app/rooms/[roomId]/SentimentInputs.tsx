import { Fragment, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Sentiment } from '@/app/db'
import { cn } from '@/utils'
import { CreatePostFormData } from './CreatePostForm'
import styles from './SentimentInputs.module.css'

export function SentimentInputs() {
  const { register } = useFormContext<CreatePostFormData>()

  const [uuid] = useState(crypto.randomUUID())

  return (
    <div className={styles.inputs}>
      {Object.values(Sentiment).map(sentiment => {
        const id = `${sentiment}-${uuid}`
        return (
          <Fragment key={sentiment}>
            <input
              {...register('sentiment')}
              className={styles.input}
              id={id}
              required
              type="radio"
              value={sentiment}
            />
            <SentimentLabel htmlFor={id} sentiment={sentiment} />
          </Fragment>
        )
      })}
    </div>
  )
}

const text: Record<Sentiment, string> = {
  [Sentiment.POSITIVE]: 'Good',
  [Sentiment.NEGATIVE]: 'Bad',
  [Sentiment.NEUTRAL]: 'Mixed',
}

export interface SentimentLabelProps {
  htmlFor?: string
  sentiment: Sentiment
}

export function SentimentLabel(props: SentimentLabelProps) {
  return (
    <label
      className={cn(styles.label, styles[props.sentiment.toLowerCase()])}
      htmlFor={props.htmlFor}
    >
      {text[props.sentiment]}
    </label>
  )
}
