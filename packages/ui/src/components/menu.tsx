import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps, ReactNode } from "react"

// ---------------------------------------------------------------------------
// Menu.Panel — Popup container with scale+opacity animation
// ---------------------------------------------------------------------------

export interface MenuPanelProps extends ComponentProps<"div"> {
  /** Minimum width utility class */
  minWidth?: string
}

function MenuPanel({
  minWidth,
  className,
  children,
  ...props
}: MenuPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-neutral bg-base-2 p-1 shadow-sm",
        minWidth,
        // Animation (works with Base UI data attributes)
        "origin-[var(--transform-origin)] will-change-[transform,opacity]",
        "transition-[transform,scale,opacity] duration-200 ease-out-expo",
        "data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0",
        "data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:duration-150",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Menu.Item — Option row with hover overlay + press squish
// ---------------------------------------------------------------------------

export interface MenuItemProps extends ComponentProps<"div"> {
  /** Icon element rendered before the label */
  icon?: ReactNode
  /** Danger styling (red text) */
  variant?: "default" | "danger"
}

function MenuItem({
  icon,
  variant = "default",
  className,
  children,
  ...props
}: MenuItemProps) {
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none",
        variant === "danger"
          ? "text-danger data-[highlighted]:text-danger"
          : "text-primary",
        className
      )}
      {...props}
    >
      {/* Hover + press overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit] bg-subtle opacity-0",
          "group-data-[highlighted]:opacity-100",
          // Squish on press
          "transition-[inset] duration-150 ease-out-expo motion-reduce:transition-none",
          "group-active:inset-px"
        )}
      />
      {icon && (
        <span
          className={cn(
            "relative z-[1] flex size-5 shrink-0 items-center justify-center [&>svg]:size-4",
            variant === "danger"
              ? "text-danger"
              : "text-tertiary group-data-[highlighted]:text-primary"
          )}
        >
          {icon}
        </span>
      )}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Menu.Separator — Divider line
// ---------------------------------------------------------------------------

export interface MenuSeparatorProps extends ComponentProps<"div"> {}

function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return (
    <div className={cn("my-1 border-t border-neutral", className)} {...props} />
  )
}

// ---------------------------------------------------------------------------
// Menu.GroupLabel — Section heading
// ---------------------------------------------------------------------------

export interface MenuGroupLabelProps extends ComponentProps<"div"> {}

function MenuGroupLabel({
  className,
  children,
  ...props
}: MenuGroupLabelProps) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-tertiary select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Menu.Positioner — z-index wrapper
// ---------------------------------------------------------------------------

export interface MenuPositionerProps extends ComponentProps<"div"> {}

function MenuPositioner({
  className,
  children,
  ...props
}: MenuPositionerProps) {
  return (
    <div className={cn("z-50 outline-none", className)} {...props}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Menu = {
  Panel: MenuPanel,
  Item: MenuItem,
  Separator: MenuSeparator,
  GroupLabel: MenuGroupLabel,
  Positioner: MenuPositioner,
}
