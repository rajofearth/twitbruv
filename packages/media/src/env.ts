import { z } from 'zod'

export const mediaEnvSchema = z.object({
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_PUBLIC_URL: z.string().url(),
})

export type MediaEnv = z.infer<typeof mediaEnvSchema>

export function loadMediaEnv(source: Record<string, string | undefined> = process.env): MediaEnv {
  return mediaEnvSchema.parse(source)
}
