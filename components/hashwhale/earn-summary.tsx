import { CalendarClock, Coins, Layers3, TrendingUp } from "lucide-react"
import { currencyUsdPrecise } from "@/lib/borrow"
import { formatEarnDate, type EarnSummary as EarnSummaryData } from "@/lib/earn"

export function EarnSummary({ summary }: { summary: EarnSummaryData }) {
  const cards = [
    {
      label: "Earning balance",
      value: currencyUsdPrecise.format(summary.totalPrincipalUsd),
      detail: "Current USD value of active principal",
      icon: Coins,
    },
    {
      label: "Rewards earned",
      value: currencyUsdPrecise.format(summary.accruedRewardsUsd),
      detail: "Accrued across active positions",
      icon: TrendingUp,
    },
    {
      label: "Average APY",
      value: `${summary.weightedAverageApy.toFixed(2)}%`,
      detail: "Principal-weighted annual yield",
      icon: Layers3,
    },
    {
      label: "Active positions",
      value: String(summary.activePositions),
      detail: summary.nextMaturityDate
        ? `Next maturity ${formatEarnDate(summary.nextMaturityDate)}`
        : "No locked maturity scheduled",
      icon: CalendarClock,
    },
  ]

  return (
    <section aria-labelledby="earn-overview-heading">
      <h2
        id="earn-overview-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wide"
        style={{ color: "var(--hw-muted)" }}
      >
        Your overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }, index) => (
          <article
            key={label}
            className="hw-card-in hw-card p-5"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--hw-muted)" }}>
                {label}
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p
              className="text-2xl font-bold tabular-nums tracking-tight"
              style={{ color: "var(--hw-text)" }}
            >
              {value}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
              {detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
