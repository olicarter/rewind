import { Sentiment } from '@/hooks/useSentimentAnalyser'
import styles from './SentimentInputs.module.css'
import { cn } from '@/utils'
import { Fragment, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { CreatePostFormData } from './CreatePostForm'

const text: Record<Sentiment, string> = {
  [Sentiment.POSITIVE]: 'Good',
  [Sentiment.NEGATIVE]: 'Bad',
  [Sentiment.NEUTRAL]: 'Mixed',
}

export function SentimentInputs() {
  const { getFieldState, register, watch } =
    useFormContext<CreatePostFormData>()

  const [content, value] = watch(['content', 'sentiment'])
  const readOnly = !!content && !getFieldState('content').isDirty

  const [uuid] = useState(crypto.randomUUID())

  return (
    <div className={styles.inputs}>
      {Object.values(Sentiment)
        .filter(sentiment => (readOnly ? sentiment === value : true))
        .map(sentiment => (
          <Fragment key={sentiment}>
            <input
              {...register('sentiment')}
              className={styles.input}
              id={`${sentiment}-${uuid}`}
              readOnly={readOnly}
              required
              tabIndex={readOnly ? -1 : 0}
              type="radio"
              value={sentiment}
            />
            <label
              className={cn(styles.label, styles[sentiment.toLowerCase()])}
              htmlFor={`${sentiment}-${uuid}`}
            >
              {text[sentiment]}
            </label>
          </Fragment>
        ))}
    </div>
  )
}
