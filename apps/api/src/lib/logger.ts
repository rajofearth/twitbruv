import pino from 'pino'

/**
 * App-wide structured logger. JSON in production for log aggregation; pretty in dev.
 * Use `log.child({ scope: 'feature' })` to namespace logs from a specific area.
 */
export function createLogger(env: { NODE_ENV: string; LOG_LEVEL: string }) {
  return pino({
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'production'
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }),
  })
}

export type Logger = ReturnType<typeof createLogger>
