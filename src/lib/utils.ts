import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Truncate a long hex value in the middle: 0xabcd…1234. Copy the full value. */
export function shortHex(value: string, lead = 6, tail = 4): string {
  if (!value) return ""
  if (value.length <= lead + tail + 1) return value
  return `${value.slice(0, lead)}…${value.slice(-tail)}`
}

/** Alias for addresses — same middle-truncation. */
export function shortAddress(address: string): string {
  return shortHex(address, 6, 4)
}

/** Human relative time, e.g. "3 days ago" / "in 5 hours". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diffSec = Math.round((then - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, secs] of units) {
    if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit)
  }
  return rtf.format(diffSec, "second")
}

/** Format an $IP price for display, e.g. 39 → "39 $IP". */
export function formatIP(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "—"
  const n = typeof price === "string" ? Number(price) : price
  if (Number.isNaN(n)) return "—"
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} $IP`
}
