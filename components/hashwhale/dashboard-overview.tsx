import { usdValueFormatter } from "@/lib/format"
import type { DashboardSummary } from "@/lib/dashboard"

export function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const details = [
    {
      label: "Total assets",
      value: usdValueFormatter.format(summary.totalAssetsUsd),
      detail: "Wallet and accrued rewards",
    },
    {
      label: "Outstanding debt",
      value: usdValueFormatter.format(summary.totalDebtUsd),
      detail: "Active loan principal",
    },
    {
      label: "Accrued rewards",
      value: usdValueFormatter.format(summary.accruedEarnRewardsUsd),
      detail: "Across active Earn positions",
    },
  ]

  return (
    <section className="hw-card overflow-hidden" aria-labelledby="financial-position-heading">
      <div className="p-5 sm:p-7">
        <p id="financial-position-heading" className="hw-eyebrow">Net account value</p>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
          {usdValueFormatter.format(summary.netAccountValueUsd)}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--hw-muted)" }}>
          Total assets minus active debt
        </p>
      </div>

      <dl className="grid grid-cols-1 border-t sm:grid-cols-3" style={{ borderColor: "var(--hw-card-border)" }}>
        {details.map((item, index) => (
          <div
            key={item.label}
            className={`px-5 py-4 sm:px-6 ${index > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}
            style={{ borderColor: "var(--hw-card-border)" }}
          >
            <dt className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>{item.label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{item.value}</dd>
            <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>{item.detail}</p>
          </div>
        ))}
      </dl>
    </section>
  )
}
