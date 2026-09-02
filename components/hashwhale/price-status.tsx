import { CloudOff, Radio } from "lucide-react"
import type { BorrowConfiguration } from "@/lib/borrow"

interface PriceStatusProps {
  configuration: BorrowConfiguration
}

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
})

export function PriceStatus({ configuration }: PriceStatusProps) {
  const isCurrent = configuration.priceSource === "COINGECKO" && !configuration.pricesStale
  const updatedAt = configuration.pricesUpdatedAt
    ? updatedAtFormatter.format(new Date(configuration.pricesUpdatedAt))
    : null

  const label = isCurrent
    ? `CoinGecko prices current${updatedAt ? ` · Updated ${updatedAt}` : ""}`
    : configuration.priceSource === "STATIC"
      ? "Configured demo prices"
      : configuration.priceSource === "COINGECKO"
        ? `Price collection delayed${updatedAt ? ` · Last update ${updatedAt}` : ""}`
        : "Price collection unavailable · Using fallback prices"

  return (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: isCurrent ? "var(--hw-success)" : "var(--hw-muted)" }}
      role="status"
      aria-live="polite"
    >
      {isCurrent ? <Radio className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </div>
  )
}
