import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { MediaEnv } from './env.ts'

export function createS3(env: MediaEnv) {
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true, // required for MinIO
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    // MinIO and some non-AWS S3 implementations return 501 for requests carrying the
    // new flexible-checksum headers that AWS SDK v3 adds by default.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

export type S3 = ReturnType<typeof createS3>

export async function presignPut(args: {
  s3: S3
  bucket: string
  key: string
  contentType: string
  contentLength: number
  expiresInSeconds?: number
}): Promise<{ url: string; headers: Record<string, string> }> {
  const command = new PutObjectCommand({
    Bucket: args.bucket,
    Key: args.key,
    ContentType: args.contentType,
    ContentLength: args.contentLength,
  })
  const url = await getSignedUrl(args.s3, command, {
    expiresIn: args.expiresInSeconds ?? 900, // 15 min
  })
  return {
    url,
    headers: { 'Content-Type': args.contentType },
  }
}

export async function headObject(s3: S3, bucket: string, key: string) {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return { exists: true as const, contentLength: res.ContentLength, contentType: res.ContentType }
  } catch (err) {
    const name = (err as { name?: string }).name
    if (name === 'NotFound' || name === 'NoSuchKey') return { exists: false as const }
    throw err
  }
}

export async function getObjectBytes(s3: S3, bucket: string, key: string): Promise<Uint8Array> {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!res.Body) throw new Error('empty S3 object')
  const chunks: Array<Uint8Array> = []
  // @ts-expect-error — Node stream; works at runtime
  for await (const chunk of res.Body) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk))
  }
  let total = 0
  for (const c of chunks) total += c.byteLength
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

export async function putObject(args: {
  s3: S3
  bucket: string
  key: string
  body: Uint8Array
  contentType: string
  cacheControl?: string
}) {
  await args.s3.send(
    new PutObjectCommand({
      Bucket: args.bucket,
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
      CacheControl: args.cacheControl ?? 'public, max-age=31536000, immutable',
    }),
  )
}

export async function deleteObject(s3: S3, bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/** Ensures the bucket exists and, where supported, sets permissive CORS for the web origin. */
export async function ensureBucket(args: {
  s3: S3
  bucket: string
  allowedOrigins: Array<string>
}) {
  try {
    await args.s3.send(new HeadBucketCommand({ Bucket: args.bucket }))
  } catch {
    await args.s3.send(new CreateBucketCommand({ Bucket: args.bucket }))
  }
  // MinIO doesn't implement PutBucketCors (uses MINIO_API_CORS_ALLOW_ORIGIN env instead).
  // R2 / real S3 do. Call it best-effort and swallow NotImplemented.
  try {
    await args.s3.send(
      new PutBucketCorsCommand({
        Bucket: args.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: args.allowedOrigins,
              AllowedMethods: ['PUT', 'GET', 'HEAD'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      }),
    )
  } catch (err) {
    const name = (err as { name?: string }).name
    if (name !== 'NotImplemented') throw err
  }

  // Public read for stored objects. In prod (R2/S3) this would be replaced with a CDN in front
  // and signed URLs where appropriate; for local dev MinIO needs an explicit policy or GETs 403.
  try {
    await args.s3.send(
      new PutBucketPolicyCommand({
        Bucket: args.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${args.bucket}/*`],
            },
          ],
        }),
      }),
    )
  } catch (err) {
    const name = (err as { name?: string }).name
    if (name !== 'NotImplemented') throw err
  }
}

/** Public (CDN-ish) URL for a stored object. In MinIO we hit the same S3 endpoint. */
export function publicUrl(env: MediaEnv, key: string) {
  return `${env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`
}
