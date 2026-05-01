import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

// ---------------------------------------------------------------------------
// Group context
// ---------------------------------------------------------------------------

interface HoverRect {
  left: number
  top: number
  width: number
  height: number
}

interface HoverGroupCtx {
  registerItem: (id: number, el: HTMLElement | null) => void
  onItemHover: (id: number) => void
  dismissHover: () => void
}

const GroupCtx = createContext<HoverGroupCtx | null>(null)

// ---------------------------------------------------------------------------
// Hover.Group
// ---------------------------------------------------------------------------

export interface HoverGroupProps {
  children: ReactNode
  /** Background class for the sliding pill */
  background?: string
  /** Border radius class for the sliding pill */
  borderRadius?: string
  className?: string
}

function measureElement(el: HTMLElement): HoverRect {
  return {
    left: el.offsetLeft,
    top: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight,
  }
}

/**
 * Groups Hover items so they share a single sliding hover indicator.
 *
 * The indicator is hover-only - it slides between items on hover and
 * fades out when the pointer leaves the group. On press, the indicator
 * background shrinks by 1px on all sides (same feel as standalone Hover).
 *
 * Active items render their own static background via the standalone
 * Hover background layer (with its own press inset effect).
 *
 * Works for both horizontal and vertical layouts automatically.
 */
export function HoverGroup({
  children,
  background = "bg-subtle",
  borderRadius = "rounded-sm",
  className,
}: HoverGroupProps) {
  const itemElements = useRef<Map<number, HTMLElement>>(new Map())

  // Hover state
  const [hoverRect, setHoverRect] = useState<HoverRect | null>(null)
  const lastRectRef = useRef<HoverRect | null>(null)
  const isHoveringRef = useRef(false)
  const [isSliding, setIsSliding] = useState(false)

  const pillRef = useRef<HTMLDivElement>(null)

  const registerItem = useCallback((id: number, el: HTMLElement | null) => {
    if (el) itemElements.current.set(id, el)
    else itemElements.current.delete(id)
  }, [])

  const onItemHover = useCallback((id: number) => {
    const el = itemElements.current.get(id)
    if (!el) return
    const rect = measureElement(el)

    if (isHoveringRef.current) {
      setIsSliding(true)
      setHoverRect(rect)
    } else {
      isHoveringRef.current = true
      setIsSliding(false)
      setHoverRect(rect)
    }
  }, [])

  const onGroupLeave = useCallback(() => {
    isHoveringRef.current = false
    setIsSliding(false)
    setHoverRect(null)
  }, [])

  const dismissHover = useCallback(() => {
    isHoveringRef.current = false
    setIsSliding(false)
    setHoverRect(null)
  }, [])

  useLayoutEffect(() => {
    if (!hoverRect || !pillRef.current) return

    if (!isSliding) {
      const el = pillRef.current
      el.style.transition = "none"
      void el.offsetHeight
      requestAnimationFrame(() => {
        el.style.transition = ""
      })
    }
    lastRectRef.current = hoverRect
  }, [hoverRect, isSliding])

  const isVisible = hoverRect !== null
  const displayRect = hoverRect ?? lastRectRef.current

  const ctxValue = useMemo(
    () => ({ registerItem, onItemHover, dismissHover }),
    [registerItem, onItemHover, dismissHover]
  )

  return (
    <GroupCtx.Provider value={ctxValue}>
      <div
        onPointerLeave={onGroupLeave}
        className={cn("group/h relative flex items-center", className)}
      >
        {/* Hover pill positioner */}
        <div
          ref={pillRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-0",
            "transition-[translate,width,height,opacity,scale] duration-200 ease-out-expo",
            "motion-reduce:transition-none",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
          style={
            displayRect
              ? {
                  width: displayRect.width,
                  height: displayRect.height,
                  translate: `${displayRect.left}px ${displayRect.top}px`,
                }
              : undefined
          }
        >
          <div
            className={cn(
              "absolute inset-0",
              background,
              borderRadius,
              "transition-[inset] duration-150 ease-out-expo",
              "group-active/h:inset-px",
              "motion-reduce:transition-none"
            )}
          />
        </div>
        {children}
      </div>
    </GroupCtx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hover
// ---------------------------------------------------------------------------

export interface HoverProps {
  children: ReactNode
  /** Force the hover background visible (e.g. active/selected state) */
  active?: boolean
  /** Background class applied to the hover layer */
  background?: string
  /** Additional classes on the animated background layer */
  backgroundClassName?: string
  /** Border radius class */
  borderRadius?: string
  /** Enable focus ring */
  focus?: boolean
  /** Enable active/press shrink effect */
  interactive?: boolean
  /** When true, hover bg appears instantly (no opacity/inset transition). */
  instantHover?: boolean
  /** Disable all hover/focus effects */
  disabled?: boolean
  /** Stretch to full width */
  fullWidth?: boolean
  className?: string
}

export function Hover({
  children,
  active = false,
  background = "bg-subtle",
  backgroundClassName,
  borderRadius = "rounded",
  focus = true,
  interactive = true,
  instantHover = false,
  disabled = false,
  fullWidth = false,
  className,
}: HoverProps) {
  const group = useContext(GroupCtx)

  if (group) {
    return (
      <HoverGrouped
        group={group}
        active={active}
        background={background}
        backgroundClassName={backgroundClassName}
        borderRadius={borderRadius}
        interactive={interactive}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </HoverGrouped>
    )
  }

  return (
    <div
      className={cn(
        "group/h relative flex items-center text-sm text-primary",
        fullWidth ? "w-full" : "w-fit",
        className
      )}
    >
      <div
        className={cn(
          "absolute",
          instantHover
            ? "transition-[inset] duration-150 ease-out-expo motion-reduce:transition-none"
            : "transition-[inset,opacity,background-color] duration-150 ease-out-expo motion-reduce:transition-none",
          background,
          backgroundClassName,
          borderRadius,
          !disabled && "group-hover/h:inset-0 group-hover/h:opacity-100",
          interactive && !disabled && "group-active/h:inset-px",
          active
            ? "inset-0 opacity-100"
            : instantHover
              ? "inset-0 opacity-0"
              : "inset-1 opacity-0",
          focus &&
            !disabled &&
            "group-has-focus-visible/h:inset-0 group-has-focus-visible/h:opacity-100 group-has-focus-visible/h:ring-2 group-has-focus-visible/h:ring-focus group-has-focus-visible/h:ring-offset-2"
        )}
      />
      <div className="relative z-[2] flex w-full items-center gap-2">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HoverGrouped
// ---------------------------------------------------------------------------

function HoverGrouped({
  children,
  group,
  active,
  background,
  backgroundClassName,
  borderRadius,
  interactive,
  disabled,
  fullWidth,
  className,
}: {
  children: ReactNode
  group: HoverGroupCtx
  active: boolean
  background: string
  backgroundClassName?: string
  borderRadius: string
  interactive: boolean
  disabled: boolean
  fullWidth: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const idRef = useRef<number | null>(null)
  if (idRef.current === null) {
    idRef.current = Math.random()
  }
  const id = idRef.current
  const groupRef = useRef(group)
  groupRef.current = group

  useLayoutEffect(() => {
    const g = groupRef.current
    g.registerItem(id, ref.current)
    return () => g.registerItem(id, null)
  }, [id])

  return (
    <div
      ref={ref}
      onPointerEnter={() => {
        if (disabled) return
        if (active) {
          group.dismissHover()
        } else {
          group.onItemHover(id)
        }
      }}
      className={cn(
        "group/hi relative z-[1] flex items-center text-sm text-primary",
        fullWidth ? "w-full" : "w-fit",
        className
      )}
    >
      <div
        className={cn(
          "absolute",
          background,
          backgroundClassName,
          borderRadius,
          "transition-[inset,opacity,scale] duration-150 ease-out-expo",
          interactive && !disabled && "group-active/hi:inset-px",
          "motion-reduce:transition-none",
          active
            ? "inset-0 scale-100 opacity-100"
            : "inset-1 scale-95 opacity-0"
        )}
      />
      <div className="relative z-[2] flex w-full items-center gap-2">
        {children}
      </div>
    </div>
  )
}
