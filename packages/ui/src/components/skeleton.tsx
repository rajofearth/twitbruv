import { cn } from "@workspace/ui/lib/utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-subtle", className)}
      {...props}
    />
  )
}
