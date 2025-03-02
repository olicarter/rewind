import { db, stageLabels } from '@/app/db'
import { Stage } from '@/app/db'
import { Button } from '@/components/Button/Button'
import { cn } from '@/utils'
import styles from './Stages.module.css'

export interface StagesProps {
  isHost: boolean
  meetingId: string
  meetingStage: Stage
}

export function Stages(props: StagesProps) {
  async function setStage(stage: Stage) {
    if (!props.isHost) return
    db.transact([
      db.tx.meetings[props.meetingId].update({
        selectedProfileIds: JSON.stringify([]),
        stage,
      }),
    ])
  }

  return (
    <ol className={styles.stages}>
      {Object.values(Stage).map(stage => (
        <li
          className={cn(
            styles.stage,
            props.meetingStage === stage && styles.active
          )}
          key={stage}
        >
          <Button disabled={!props.isHost} onClick={() => setStage(stage)}>
            {stageLabels[stage]}
          </Button>
        </li>
      ))}
    </ol>
  )
}
