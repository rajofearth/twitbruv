import type { ReactNode } from "react"

// Deprecated: the old sticky header has been removed.
// This file is kept as a no-op so existing usePageHeader() calls in routes
// don't need to be touched yet.

export type AppPageHeaderSpec = {
  title: ReactNode
  action?: ReactNode
  className?: string
  plainTitle?: boolean
} | null

export function usePageHeader(_spec: AppPageHeaderSpec) {
  // no-op
}
