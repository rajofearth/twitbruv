import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

const baseClass =
  "bg-subtle inline-flex items-center gap-1.5 rounded-md py-1 px-2 pr-2.5"

type MetaPillProps = {
  icon: ReactNode
  children: ReactNode
  className?: string
  href?: string
  target?: React.HTMLAttributeAnchorTarget
  rel?: string
}

export function MetaPill({
  icon,
  children,
  className,
  href,
  target = "_blank",
  rel = "noreferrer",
}: MetaPillProps) {
  const inner = (
    <>
      {icon}
      {children}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={cn(
          baseClass,
          "text-primary no-underline transition-colors hover:underline",
          className
        )}
      >
        {inner}
      </a>
    )
  }

  return <span className={cn(baseClass, className)}>{inner}</span>
}
