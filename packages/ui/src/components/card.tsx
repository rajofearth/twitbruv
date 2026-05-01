import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

const variantStyles = {
  default: "bg-base-1 rounded-lg shadow-xs ring-1 ring-neutral",
  nested: "bg-base-2 rounded-sm shadow-sm ring-1 ring-neutral",
} as const

export type CardVariant = keyof typeof variantStyles

export interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
}

export interface CardContentProps {
  className?: string
  children: ReactNode
}

export interface CardHeaderProps {
  className?: string
  children: ReactNode
}

export interface CardBodyProps {
  className?: string
  children: ReactNode
}

export interface CardSectionProps {
  className?: string
  children: ReactNode
}

function CardContent({ className, children }: CardContentProps) {
  return (
    <div className={cn("flex flex-col gap-1 p-1", className)}>{children}</div>
  )
}

function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>
}

function CardBody({ className, children }: CardBodyProps) {
  return <div className={cn("p-4", className)}>{children}</div>
}

function CardSection({ className, children }: CardSectionProps) {
  return (
    <div
      className={cn("border-b border-neutral p-4 last:border-b-0", className)}
    >
      {children}
    </div>
  )
}

export function Card({ variant = "default", className, children }: CardProps) {
  return <div className={cn(variantStyles[variant], className)}>{children}</div>
}

Card.Content = CardContent
Card.Header = CardHeader
Card.Body = CardBody
Card.Section = CardSection
