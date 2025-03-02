import { Fragment } from 'react'
import { useFormContext } from 'react-hook-form'
import { Sentiment, sentimentLabels } from '@/app/db'
import { RadioButton } from '@/components/RadioButton'
import { CreatePostFormData } from './CreatePostForm'
import styles from './SentimentInputs.module.css'

interface SentimentInputsProps {
  size?: 'small' | 'medium' | 'large'
}

export function SentimentInputs({ size = 'medium' }: SentimentInputsProps) {
  const { register } = useFormContext<CreatePostFormData>()

  return (
    <div className={styles.inputs}>
      {Object.values(Sentiment).map(sentiment => (
        <Fragment key={sentiment}>
          <RadioButton
            {...register('sentiment')}
            className={sentiment.toLowerCase()}
            required
            size={size}
            value={sentiment}
          >
            {sentimentLabels[sentiment]}
          </RadioButton>
        </Fragment>
      ))}
    </div>
  )
}
