import type { Database } from '@workspace/db'
import { z } from 'zod'
import {
  fetchXStatusCard,
  parseXUrl,
  persistFailureOnly,
  persistXStatusCardOutcome,
} from '@workspace/x-unfurl'

const payloadSchema = z.object({
  unfurlId: z.string().uuid(),
  url: z.string(),
  refKey: z.string().min(1),
})

export async function handleXUnfurlJob(
  db: Database,
  raw: unknown,
  baseUrl?: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_payload' }
  }
  const ref = parseXUrl(parsed.data.url)
  if (!ref) {
    await persistFailureOnly(db, parsed.data.unfurlId, 'unknown', 'parse_failed')
    return { ok: false, reason: 'parse_failed' }
  }
  const outcome = await fetchXStatusCard(ref, { baseUrl })
  await persistXStatusCardOutcome(db, parsed.data.unfurlId, outcome)
  return { ok: outcome.ok, ...(outcome.ok ? {} : { reason: outcome.reason }) }
}
