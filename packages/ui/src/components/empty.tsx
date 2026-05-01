import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

const mediaVariantStyles = {
  default: "bg-transparent",
  icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-subtle text-primary [&_svg:not([class*='size-'])]:size-4",
} as const

export type EmptyMediaVariant = keyof typeof mediaVariantStyles

export interface EmptyProps {
  className?: string
  children: ReactNode
}

export function Empty({ className, children }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance",
        className
      )}
    >
      {children}
    </div>
  )
}

export function EmptyHeader({ className, children }: EmptyProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-1", className)}
    >
      {children}
    </div>
  )
}

export function EmptyMedia({
  variant = "default",
  className,
  children,
}: {
  variant?: EmptyMediaVariant
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-slot="empty-icon"
      className={cn(
        "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
        mediaVariantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

export function EmptyTitle({ className, children }: EmptyProps) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-sm font-medium tracking-tight", className)}
    >
      {children}
    </div>
  )
}

export function EmptyDescription({ className, children }: EmptyProps) {
  return (
    <div
      data-slot="empty-description"
      className={cn("text-xs/relaxed text-secondary", className)}
    >
      {children}
    </div>
  )
}

export function EmptyContent({ className, children }: EmptyProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2 text-xs/relaxed text-balance",
        className
      )}
    >
      {children}
    </div>
  )
}
