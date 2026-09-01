import { CircleDollarSign, Coins, HandCoins, Sparkles } from "lucide-react"
import { currencyUsdPrecise } from "@/lib/borrow"
import type { DashboardSummary } from "@/lib/dashboard"

export function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  const supportingCards = [
    {
      label: "Total assets",
      value: currencyUsdPrecise.format(summary.totalAssetsUsd),
      detail: "Wallet value plus accrued rewards",
      icon: Coins,
    },
    {
      label: "Outstanding debt",
      value: currencyUsdPrecise.format(summary.totalDebtUsd),
      detail: "Active loan principal",
      icon: HandCoins,
    },
    {
      label: "Earned rewards",
      value: currencyUsdPrecise.format(summary.accruedEarnRewardsUsd),
      detail: "Accrued across active Earn positions",
      icon: Sparkles,
    },
  ]

  return (
    <section aria-labelledby="financial-position-heading">
      <h2 id="financial-position-heading" className="sr-only">Financial position</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <article
          className="hw-card-in hw-card relative overflow-hidden p-6 sm:p-7 lg:col-span-2"
          style={{ borderColor: "var(--hw-primary)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full" style={{ background: "var(--hw-glow)" }} />
          <div className="relative">
            <span className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}>
              <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium" style={{ color: "var(--hw-muted)" }}>Net account value</p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl" style={{ color: "var(--hw-text)" }}>
              {currencyUsdPrecise.format(summary.netAccountValueUsd)}
            </p>
            <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4 text-xs" style={{ borderColor: "var(--hw-input-border)" }}>
              <span style={{ color: "var(--hw-muted)" }}>Assets minus active debt</span>
              <span className="rounded-full px-2.5 py-1 font-bold" style={{ color: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}>
                Cross-product view
              </span>
            </div>
          </div>
        </article>

        {supportingCards.map(({ label, value, detail, icon: Icon }, index) => (
          <article
            key={label}
            className="hw-card-in hw-card p-5 lg:col-span-1"
            style={{ animationDelay: `${(index + 1) * 55}ms` }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--hw-track)", color: "var(--hw-primary)" }}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--hw-muted)" }}>{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight" style={{ color: "var(--hw-text)" }}>{value}</p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
