import { pipeline } from '@huggingface/transformers'

class PipelineSingleton {
  static task = 'sentiment-analysis'
  static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
  static instance = null

  static async getInstance(progress_callback) {
    if (!this.instance) {
      this.instance = await pipeline(this.task, this.model, {
        progress_callback,
      })
    }
    return this.instance
  }
}

self.addEventListener('message', async event => {
  if (event.data.text === '') {
    self.postMessage({
      status: 'complete',
      output: [null],
    })
    return
  }

  const classifier = await PipelineSingleton.getInstance(x => {
    self.postMessage(x)
  })

  const output = await classifier?.(event.data.text)

  self.postMessage({
    status: 'complete',
    output: output,
  })
})

// Needed to make this file a module
export {}
