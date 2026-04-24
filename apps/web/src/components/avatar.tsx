import { cn } from "@workspace/ui/lib/utils"

export function Avatar({
  initial,
  src,
  className,
}: {
  initial: string
  src?: string | null
  className?: string
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "size-8 shrink-0 rounded-full object-cover",
          className,
        )}
      />
    )
  }
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/80 uppercase",
        className,
      )}
    >
      {initial}
    </div>
  )
}
