import { createAuthClient } from 'better-auth/react'
import { magicLinkClient } from 'better-auth/client/plugins'

export function createClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [magicLinkClient()],
    fetchOptions: {
      credentials: 'include',
    },
  })
}

export type AuthClient = ReturnType<typeof createClient>
