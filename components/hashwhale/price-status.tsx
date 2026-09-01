import { CloudOff, Radio } from "lucide-react"
import type { BorrowConfiguration } from "@/lib/borrow"

interface PriceStatusProps {
  configuration: BorrowConfiguration
}

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
})

export function PriceStatus({ configuration }: PriceStatusProps) {
  const isLive = configuration.priceSource === "COINGECKO" && !configuration.pricesStale
  const updatedAt = configuration.pricesUpdatedAt
    ? updatedAtFormatter.format(new Date(configuration.pricesUpdatedAt))
    : null

  return (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: isLive ? "var(--hw-success)" : "var(--hw-muted)" }}
      role="status"
      aria-live="polite"
    >
      {isLive ? <Radio className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      <span>
        {isLive
          ? `Live BTC/ETH prices by CoinGecko${updatedAt ? ` · Market data as of ${updatedAt}` : ""}`
          : configuration.priceSource === "STATIC"
            ? "Configured demo prices"
            : configuration.priceSource === "COINGECKO"
              ? `Live price feed delayed · Using the last known prices${updatedAt ? ` from ${updatedAt}` : ""}`
              : "Live price feed unavailable · Using fallback prices"}
      </span>
    </div>
  )
}
