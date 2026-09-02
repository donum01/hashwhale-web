import { formatRate, usdValueFormatter } from "@/lib/format"
import { formatEarnDate, type EarnSummary as EarnSummaryData } from "@/lib/earn"

export function EarnSummary({ summary }: { summary: EarnSummaryData }) {
  const items = [
    {
      label: "Earning balance",
      value: usdValueFormatter.format(summary.totalPrincipalUsd),
      detail: "Active principal",
    },
    {
      label: "Accrued rewards",
      value: usdValueFormatter.format(summary.accruedRewardsUsd),
      detail: "Across active positions",
    },
    {
      label: "Weighted APY",
      value: formatRate(summary.weightedAverageApy),
      detail: "Annualized estimate",
    },
    {
      label: "Active positions",
      value: String(summary.activePositions),
      detail: summary.nextMaturityDate
        ? `Next maturity ${formatEarnDate(summary.nextMaturityDate)}`
        : "No maturity scheduled",
    },
  ]

  const dividerClasses = [
    "",
    "border-t sm:border-l sm:border-t-0",
    "border-t xl:border-l xl:border-t-0",
    "border-t sm:border-l xl:border-t-0",
  ]

  return (
    <section className="hw-card overflow-hidden" aria-labelledby="earn-overview-heading">
      <div className="hw-panel-header">
        <div>
          <h2 id="earn-overview-heading" className="text-lg font-semibold">Earn overview</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>Current positions and estimated yield</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`px-5 py-4 ${dividerClasses[index]}`}
            style={{ borderColor: "var(--hw-card-border)" }}
          >
            <dt className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>{item.label}</dt>
            <dd className="mt-1.5 text-xl font-semibold tabular-nums">{item.value}</dd>
            <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>{item.detail}</p>
          </div>
        ))}
      </dl>
    </section>
  )
}
