import { cn } from "@workspace/ui/lib/utils"
import type { CSSProperties, ReactNode } from "react"

const variantStyles = {
  neutral: "bg-subtle text-secondary",
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warn-subtle text-warn",
  success: "bg-success-subtle text-success",
  merged: "bg-violet-500/15 text-violet-700",
} as const

export type BadgeVariant = keyof typeof variantStyles

export interface BadgeProps {
  variant?: BadgeVariant
  /** Hex color (e.g. "#d73a4a" or "d73a4a"). Overrides variant. Computes background and foreground automatically. */
  color?: string | null
  className?: string
  children: ReactNode
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "")
  if (clean.length !== 6) return null
  const n = parseInt(clean, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function luminance(r: number, g: number, b: number): number {
  const lin = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}

function colorStyles(hex: string): CSSProperties | null {
  const raw = hex.startsWith("#") ? hex : `#${hex}`
  const rgb = hexToRgb(raw)
  if (!rgb) return null
  const [r, g, b] = rgb
  const lum = luminance(r, g, b)
  const fg = lum > 0.4 ? `oklch(0.35 0.15 ${hueFromRgb(r, g, b)})` : raw
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    color: fg,
  }
}

function hueFromRgb(r: number, g: number, b: number): number {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  if (d === 0) return 0
  let h = 0
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h = Math.round(h * 60)
  return h < 0 ? h + 360 : h
}

export function Badge({
  variant = "neutral",
  color,
  className,
  children,
}: BadgeProps) {
  const style = color ? colorStyles(color) : undefined
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs leading-tight font-medium",
        !style && variantStyles[variant],
        className
      )}
      style={style ?? undefined}
    >
      {children}
    </span>
  )
}
