import Link from "next/link"
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, CircleAlert, Info, ShieldCheck, Sparkles, WalletCards } from "lucide-react"
import { currencyUsdPrecise } from "@/lib/borrow"
import { formatEarnDate } from "@/lib/earn"
import type { AlertSeverity, BorrowHealth, DashboardSummary } from "@/lib/dashboard"

function severityStyle(severity: AlertSeverity) {
  if (severity === "CRITICAL") return { color: "var(--hw-error)", background: "rgba(255, 100, 13, 0.10)", icon: CircleAlert }
  if (severity === "WARNING") return { color: "var(--hw-ltv-warn)", background: "rgba(224, 145, 43, 0.10)", icon: AlertCircle }
  return { color: "var(--hw-primary)", background: "var(--hw-primary-soft)", icon: Info }
}

function healthLabel(health: BorrowHealth) {
  if (health === "NONE") return "No active loans"
  if (health === "HEALTHY") return "Healthy"
  if (health === "WARNING") return "Watch closely"
  return "At risk"
}

function healthColor(health: BorrowHealth) {
  if (health === "HEALTHY") return "var(--hw-ltv-safe)"
  if (health === "WARNING") return "var(--hw-ltv-warn)"
  if (health === "AT_RISK") return "var(--hw-error)"
  return "var(--hw-muted)"
}

export function ActionCenter({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="hw-card p-5 sm:p-6" aria-labelledby="action-center-heading">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="action-center-heading" className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>Action centre</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>Only items that may need your attention.</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: summary.alerts.length ? "var(--hw-ltv-warn)" : "var(--hw-ltv-safe)", background: "var(--hw-track)" }}>
          {summary.alerts.length} {summary.alerts.length === 1 ? "notice" : "notices"}
        </span>
      </div>

      {summary.alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "var(--hw-track)" }}>
          <CheckCircle2 className="h-5 w-5" style={{ color: "var(--hw-ltv-safe)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>Nothing needs attention</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--hw-muted)" }}>Your simulated products are currently in a normal state.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {summary.alerts.map((alert, index) => {
            const style = severityStyle(alert.severity)
            const Icon = style.icon
            return (
              <article key={`${alert.title}-${index}`} className="hw-card-in flex items-start gap-3 rounded-xl p-4" style={{ background: style.background, animationDelay: `${index * 45}ms` }}>
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: style.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: "var(--hw-text)" }}>{alert.title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>{alert.message}</p>
                </div>
                {alert.href && alert.actionLabel ? (
                  <Link href={alert.href} className="shrink-0 text-xs font-bold hover:underline" style={{ color: style.color }}>
                    {alert.actionLabel}
                  </Link>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function CapitalAllocation({ summary }: { summary: DashboardSummary }) {
  const items = [
    { label: "Available", value: summary.availableUsd, color: "var(--hw-primary)" },
    { label: "In Earn", value: summary.earnPrincipalUsd, color: "var(--hw-ltv-safe)" },
    { label: "Loan collateral", value: summary.collateralUsd, color: "var(--hw-accent)" },
  ]
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const availableEnd = total ? (items[0].value / total) * 100 : 0
  const earnEnd = total ? availableEnd + (items[1].value / total) * 100 : 0
  const donut = total
    ? `conic-gradient(${items[0].color} 0 ${availableEnd}%, ${items[1].color} ${availableEnd}% ${earnEnd}%, ${items[2].color} ${earnEnd}% 100%)`
    : "var(--hw-track)"

  return (
    <section className="hw-card p-5 sm:p-6" aria-labelledby="allocation-heading">
      <h2 id="allocation-heading" className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>Capital allocation</h2>
      <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>How your assets are currently being used.</p>
      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: donut }} role="img" aria-label="Capital allocation chart">
          <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full text-center" style={{ background: "var(--hw-card)" }}>
            <span className="text-xs" style={{ color: "var(--hw-muted)" }}>Allocated</span>
            <strong className="mt-0.5 text-sm tabular-nums" style={{ color: "var(--hw-text)" }}>{currencyUsdPrecise.format(total)}</strong>
          </div>
        </div>
        <div className="w-full space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2" style={{ color: "var(--hw-muted)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /> {item.label}
              </span>
              <span className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
                {currencyUsdPrecise.format(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductHealth({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link href="/borrow" className="hw-card-hover hw-card block p-5" aria-label="View Borrow health">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--hw-track)", color: "var(--hw-primary)" }}>
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: healthColor(summary.borrowHealth), background: "var(--hw-track)" }}>
            {healthLabel(summary.borrowHealth)}
          </span>
        </div>
        <p className="mt-5 text-sm font-semibold" style={{ color: "var(--hw-muted)" }}>Borrow health</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>{summary.activeLoanCount}</p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>{summary.activeLoanCount === 1 ? "active loan" : "active loans"}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums" style={{ color: healthColor(summary.borrowHealth) }}>{summary.highestLtvPercent.toFixed(2)}%</p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>highest LTV</p>
          </div>
        </div>
      </Link>

      <Link href="/earn" className="hw-card-hover hw-card block p-5" aria-label="View Earn performance">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}>
            <Sparkles className="h-5 w-5" />
          </span>
          {summary.nextEarnMaturityDate ? (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}>
              <CalendarClock className="h-3 w-3" /> {formatEarnDate(summary.nextEarnMaturityDate)}
            </span>
          ) : null}
        </div>
        <p className="mt-5 text-sm font-semibold" style={{ color: "var(--hw-muted)" }}>Earn performance</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>{summary.activeEarnPositionCount}</p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>active positions</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--hw-ltv-safe)" }}>{summary.weightedAverageEarnApy.toFixed(2)}%</p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>weighted APY</p>
          </div>
        </div>
      </Link>
    </div>
  )
}

export function RecommendedAction({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="hw-card relative overflow-hidden p-5 sm:p-6" aria-labelledby="recommendation-heading" style={{ borderColor: "var(--hw-primary)" }}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full" style={{ background: "var(--hw-glow)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--hw-primary)" }}>
          <WalletCards className="h-4 w-4" /> Suggested next action
        </div>
        <h2 id="recommendation-heading" className="mt-4 text-xl font-bold" style={{ color: "var(--hw-text)" }}>{summary.recommendation.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--hw-muted)" }}>{summary.recommendation.message}</p>
        <Link href={summary.recommendation.href} className="hw-submit mt-5 inline-flex h-10 items-center gap-2 px-4 text-sm font-bold">
          {summary.recommendation.actionLabel} <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-[11px]" style={{ color: "var(--hw-muted)" }}>Rule-based simulation prompt—not financial advice.</p>
      </div>
    </section>
  )
}
