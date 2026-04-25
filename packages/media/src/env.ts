import { z } from 'zod'

export const mediaEnvSchema = z.object({
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('auto'),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_PUBLIC_URL: z.string().url(),
  // When set, public asset URLs route through a proxy endpoint that issues short-lived signed
  // S3 URLs. Used in production with private buckets (e.g. Tigris) where direct public reads
  // aren't supported. Should look like `https://api.example.com/api/m`.
  MEDIA_PROXY_BASE: z.string().url().optional(),
})

export type MediaEnv = z.infer<typeof mediaEnvSchema>

export function loadMediaEnv(source: Record<string, string | undefined> = process.env): MediaEnv {
  return mediaEnvSchema.parse(source)
}
