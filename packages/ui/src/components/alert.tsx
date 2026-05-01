import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

const variantStyles = {
  default: "bg-base-1 text-primary",
  destructive:
    "bg-base-1 text-danger *:data-[slot=alert-description]:text-danger/90",
} as const

export type AlertVariant = keyof typeof variantStyles

export interface AlertProps {
  variant?: AlertVariant
  className?: string
  children: ReactNode
}

export function Alert({
  variant = "default",
  className,
  children,
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "relative grid w-full gap-0.5 rounded-lg border border-neutral px-2 py-1.5 text-left text-xs/relaxed has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-1.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-3.5",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

export function AlertTitle({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div data-slot="alert-title" className={cn("font-medium", className)}>
      {children}
    </div>
  )
}

export function AlertDescription({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs/relaxed text-balance text-secondary", className)}
    >
      {children}
    </div>
  )
}

export function AlertAction({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1.5 right-2", className)}
    >
      {children}
    </div>
  )
}
