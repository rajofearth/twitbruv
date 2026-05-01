import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"
import { cn } from "@workspace/ui/lib/utils"

export interface CheckboxProps extends CheckboxPrimitive.Root.Props {}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-4 shrink-0 rounded-sm border border-neutral bg-base-2 transition-colors outline-none",
        "focus-visible:border-neutral-strong focus-visible:ring-2 focus-visible:ring-neutral/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-checked:border-inverse data-checked:bg-inverse data-checked:text-inverse",
        "data-indeterminate:border-inverse data-indeterminate:bg-inverse data-indeterminate:text-inverse",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.indeterminate ? (
          <MinusIcon className="size-3" />
        ) : (
          <CheckIcon className="size-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
