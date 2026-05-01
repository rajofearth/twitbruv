import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

export function SettingsSection({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      {children}
    </section>
  )
}

export function SettingsSectionTitle({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <h2 className={cn("text-sm font-semibold text-primary", className)}>
      {children}
    </h2>
  )
}

export function SettingsSectionDescription({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <p className={cn("text-xs text-secondary", className)}>{children}</p>
}
