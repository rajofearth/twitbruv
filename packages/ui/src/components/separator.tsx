import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "@workspace/ui/lib/utils"

export interface SeparatorProps extends SeparatorPrimitive.Props {}

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn(
        "bg-neutral shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}
