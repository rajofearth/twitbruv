import { useEffect, useRef, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface AnimatedNumberProps {
  value: number
  /** Format function (e.g. compact notation). Defaults to locale string. */
  format?: (n: number) => string
  className?: string
}

/**
 * Animated number display — each character slides up or down
 * independently when the value changes (odometer / slot machine effect).
 */
export function AnimatedNumber({
  value,
  format = formatCompact,
  className,
}: AnimatedNumberProps) {
  const formatted = format(value)
  const prevFormatted = useRef(formatted)
  const [chars, setChars] = useState(() =>
    formatted.split("").map((ch, i) => ({ ch, key: `${i}-${ch}`, from: ch }))
  )

  useEffect(() => {
    const prev = prevFormatted.current
    const next = formatted
    prevFormatted.current = next

    if (prev === next) return

    const prevChars = prev.split("")
    const nextChars = next.split("")

    // Align from the right so digits stay in place when length changes
    const maxLen = Math.max(prevChars.length, nextChars.length)
    const padPrev =
      prevChars.length < maxLen
        ? Array(maxLen - prevChars.length)
            .fill("")
            .concat(prevChars)
        : prevChars
    const padNext =
      nextChars.length < maxLen
        ? Array(maxLen - nextChars.length)
            .fill("")
            .concat(nextChars)
        : nextChars

    setChars(
      padNext.map((ch, i) => ({
        ch,
        key: `${i}-${ch}-${Date.now()}`,
        from: padPrev[i] ?? "",
      }))
    )
  }, [formatted])

  if (value <= 0) return null

  return (
    <span className={cn("inline-flex overflow-hidden tabular-nums", className)}>
      {chars.map(({ ch, key, from }) => (
        <AnimatedChar key={key} char={ch} from={from} />
      ))}
    </span>
  )
}

function AnimatedChar({ char, from }: { char: string; from: string }) {
  const isDigit = /\d/.test(char)
  const fromIsDigit = /\d/.test(from)
  const changed = char !== from

  // For non-digit characters (K, M, .) or unchanged digits, just render static
  if (!isDigit || !fromIsDigit || !changed) {
    return <span className="inline-block">{char}</span>
  }

  const fromNum = parseInt(from)
  const toNum = parseInt(char)
  const goingUp = toNum > fromNum || (fromNum === 9 && toNum === 0)

  return (
    <span className="relative inline-block h-[1lh] overflow-hidden">
      {/* Old digit slides out */}
      <span
        className="inline-block animate-[slideOut_200ms_ease-out_forwards]"
        style={{
          // @ts-expect-error -- CSS custom property
          "--dir": goingUp ? "-100%" : "100%",
        }}
      >
        {from}
      </span>
      {/* New digit slides in */}
      <span
        className="absolute top-0 left-0 inline-block animate-[slideIn_200ms_ease-out_forwards]"
        style={{
          // @ts-expect-error -- CSS custom property
          "--dir": goingUp ? "100%" : "-100%",
        }}
      >
        {char}
      </span>
    </span>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
