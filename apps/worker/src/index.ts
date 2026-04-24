import PgBoss from 'pg-boss'
import { createMailer } from '@workspace/email'
import { createDbFromEnv } from '@workspace/db'
import { createS3 } from '@workspace/media/s3'
import type { MediaEnv } from '@workspace/media/env'
import { loadEnv } from './env.ts'
import { handleEmailJob } from './jobs/email.ts'
import { handleMediaJob } from './jobs/media-process.ts'

const env = loadEnv()

const mailer = createMailer({
  from: env.EMAIL_FROM,
  provider: env.EMAIL_PROVIDER,
  resendApiKey: env.RESEND_API_KEY,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

const db = createDbFromEnv()
const mediaEnv: MediaEnv = {
  S3_ENDPOINT: env.S3_ENDPOINT,
  S3_REGION: env.S3_REGION,
  S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
  S3_BUCKET: env.S3_BUCKET,
  S3_PUBLIC_URL: env.S3_PUBLIC_URL,
}
const s3 = createS3(mediaEnv)

const boss = new PgBoss({ connectionString: env.DATABASE_URL })
boss.on('error', (err) => console.error('pg-boss error:', err))

await boss.start()
// pg-boss v10 needs queues declared before work/send. Idempotent.
// Serialize: creating two queues in parallel deadlocks on pgboss.queue row locks.
await boss.createQueue('email.send')
await boss.createQueue('media.process')

await boss.work('email.send', { batchSize: 5 }, async (jobs) => {
  await Promise.all(jobs.map((job) => handleEmailJob(mailer, job.data)))
})

await boss.work('media.process', { batchSize: 2 }, async (jobs) => {
  for (const job of jobs) {
    console.log('[media.process] processing', job.data)
    try {
      await handleMediaJob({ db, s3, env: mediaEnv, payload: job.data })
      console.log('[media.process] done', job.data)
    } catch (err) {
      console.error('[media.process] failed', job.data, err)
      throw err
    }
  }
})

console.log('worker ready — queues: email.send, media.process')

const shutdown = async () => {
  console.log('shutting down worker')
  await boss.stop({ graceful: true })
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
