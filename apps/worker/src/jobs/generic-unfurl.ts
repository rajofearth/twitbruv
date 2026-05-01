import type { Database } from '@workspace/db'
import { z } from 'zod'
import { fetchGenericCard, persistGenericCardOutcome } from '@workspace/url-unfurl-core'

const payloadSchema = z.object({
  unfurlId: z.string().uuid(),
  url: z.string(),
  refKey: z.string().min(1),
})

export type GenericUnfurlPayload = z.infer<typeof payloadSchema>

export async function handleGenericUnfurlJob(
  db: Database,
  raw: unknown,
): Promise<{ ok: boolean; reason?: string }> {
  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_payload' }
  }
  const outcome = await fetchGenericCard(parsed.data.url)
  await persistGenericCardOutcome(db, parsed.data.unfurlId, outcome)
  return { ok: outcome.ok, ...(outcome.ok ? {} : { reason: outcome.reason }) }
}
