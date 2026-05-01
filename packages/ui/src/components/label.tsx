import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

export interface LabelProps extends ComponentProps<"label"> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-xs leading-none font-medium text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}
