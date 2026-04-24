// Exports a default auth instance so the better-auth CLI can introspect the config.
// Only used by `bunx @better-auth/cli generate`; runtime code uses buildContext().
import { buildContext } from './context.ts'

export const auth = (await buildContext()).auth
export default auth
