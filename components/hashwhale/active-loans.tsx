"use client"

import { useState } from "react"
import { CalendarClock, ChevronDown, History, Loader2, Wallet } from "lucide-react"
import {
  loanDateTimeFormatter,
  liquidationPrice,
  loanLtv,
  ltvTier,
  ltvTierColorVar,
  type BorrowConfiguration,
  type Loan,
} from "@/lib/borrow"
import { formatAssetAmount, formatRate, usdValueFormatter } from "@/lib/format"
import { AssetChip } from "./asset-chip"

function LtvBadge({ ltv, configuration }: { ltv: number; configuration: BorrowConfiguration }) {
  const tier = ltvTier(ltv, configuration)
  const color = ltvTierColorVar(tier)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
        tier === "danger" ? "hw-warn-pulse" : ""
      }`}
      style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      {ltv.toFixed(1)}% LTV
    </span>
  )
}

function LoanStatusBadge({ status }: { status: Loan["status"] }) {
  const repaid = status === "REPAID"
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        color: repaid ? "var(--hw-ltv-safe)" : "var(--hw-error)",
        background: repaid
          ? "color-mix(in srgb, var(--hw-ltv-safe) 12%, transparent)"
          : "color-mix(in srgb, var(--hw-error) 12%, transparent)",
      }}
    >
      {repaid ? "Repaid" : "Liquidated"}
    </span>
  )
}

function LoanCard({
  loan,
  configuration,
  onRepay,
}: {
  loan: Loan
  configuration: BorrowConfiguration
  onRepay?: (id: number) => Promise<void>
}) {
  const [repaying, setRepaying] = useState(false)
  const [confirmingRepayment, setConfirmingRepayment] = useState(false)
  const active = loan.status === "ACTIVE"
  const ltv = loanLtv(loan, configuration)
  const liq = liquidationPrice(loan, configuration)
  const showLiqWarning = ltv >= configuration.warningLtvPercent

  async function repay() {
    if (!onRepay) return
    setRepaying(true)
    await onRepay(loan.id)
    setRepaying(false)
    setConfirmingRepayment(false)
  }

  return (
    <article className="hw-data-row p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetChip asset={loan.asset} size={40} />
          <div>
            <p className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
              {formatAssetAmount(loan.collateralAmount, loan.asset)}
            </p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>Collateral</p>
          </div>
        </div>
        {active ? <LtvBadge ltv={ltv} configuration={configuration} /> : <LoanStatusBadge status={loan.status} />}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: "var(--hw-muted)" }}>Borrowed</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
            {formatAssetAmount(loan.borrowedUsdt, "USDT")}
          </p>
        </div>
        {active && onRepay ? (
          <button
            type="button"
            onClick={() => setConfirmingRepayment(true)}
            disabled={repaying}
            className="hw-btn-outline flex h-11 items-center justify-center gap-1.5 px-4 text-sm font-semibold disabled:opacity-60"
          >
            {repaying ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Repaying</> : "Repay"}
          </button>
        ) : null}
      </div>

      {active ? (
        <>
          <p
            className="mt-3 text-xs font-medium tabular-nums"
            style={{ color: showLiqWarning ? "var(--hw-error)" : "var(--hw-muted)" }}
          >
            Liquidation price: {usdValueFormatter.format(liq)}
          </p>
          <p className="mt-1 text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
            Interest rate: {formatRate(loan.interestRateApr)} APR
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
          Final status: {loan.status === "REPAID" ? "Collateral released" : "Collateral liquidated"}
        </p>
      )}
      {active && confirmingRepayment ? (
        <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-track)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>Review repayment</p>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div><dt style={{ color: "var(--hw-muted)" }}>Principal due</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(loan.borrowedUsdt, "USDT")}</dd></div>
            <div><dt style={{ color: "var(--hw-muted)" }}>Collateral released</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(loan.collateralAmount, loan.asset)}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
            This demo repayment uses the recorded principal; accrued interest is not currently charged.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmingRepayment(false)} disabled={repaying} className="hw-btn-outline h-11 px-4 text-sm font-semibold">Cancel</button>
            <button type="button" onClick={() => void repay()} disabled={repaying} className="hw-submit flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold">
              {repaying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Confirm repayment
            </button>
          </div>
        </div>
      ) : null}
      <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--hw-muted)" }}>
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Opened</span>
        <time dateTime={loan.createdAt}>{loanDateTimeFormatter.format(new Date(loan.createdAt))}</time>
        <span>· #{loan.id}</span>
      </p>
    </article>
  )
}

function EmptyState({ tab }: { tab: "ACTIVE" | "HISTORY" }) {
  const active = tab === "ACTIVE"
  return (
    <div className="hw-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center" style={{ borderStyle: "dashed" }}>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
      >
        {active ? <Wallet className="h-6 w-6" /> : <History className="h-6 w-6" />}
      </span>
      <p className="font-semibold" style={{ color: "var(--hw-text)" }}>
        {active ? "No active loans" : "No closed loans"}
      </p>
      <p className="max-w-[260px] text-sm leading-relaxed" style={{ color: "var(--hw-muted)" }}>
        {active
          ? "Create a collateral-backed loan and it will appear here."
          : "Repaid and liquidated loans will appear here."}
      </p>
    </div>
  )
}

export function ActiveLoans({
  activeLoans,
  historyLoans,
  activeHasMore,
  historyHasMore,
  loadingMore,
  onLoadMoreActive,
  onLoadMoreHistory,
  configuration,
  onRepay,
}: {
  activeLoans: Loan[]
  historyLoans: Loan[]
  activeHasMore: boolean
  historyHasMore: boolean
  loadingMore: "ACTIVE" | "HISTORY" | null
  onLoadMoreActive: () => void
  onLoadMoreHistory: () => void
  configuration: BorrowConfiguration
  onRepay: (id: number) => Promise<void>
}) {
  const [tab, setTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE")
  const loans = tab === "ACTIVE" ? activeLoans : historyLoans
  const hasMore = tab === "ACTIVE" ? activeHasMore : historyHasMore
  const loadMore = tab === "ACTIVE" ? onLoadMoreActive : onLoadMoreHistory

  return (
    <section className="flex flex-col gap-4" aria-labelledby="loan-list-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="loan-list-heading" className="text-lg font-semibold" style={{ color: "var(--hw-text)" }}>Loans</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>Open positions and account history</p>
        </div>
        <div className="hw-tabs grid grid-cols-2 gap-1 p-1">
          {(["ACTIVE", "HISTORY"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{
                background: tab === value ? "var(--hw-indicator)" : "transparent",
                color: tab === value ? "var(--hw-text)" : "var(--hw-muted)",
              }}
              aria-pressed={tab === value}
            >
              {value === "ACTIVE"
                ? `Active (${activeLoans.length}${activeHasMore ? "+" : ""})`
                : `History (${historyLoans.length}${historyHasMore ? "+" : ""})`}
            </button>
          ))}
        </div>
      </div>

      {loans.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="hw-card overflow-hidden">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              configuration={configuration}
              onRepay={tab === "ACTIVE" ? onRepay : undefined}
            />
          ))}
          {hasMore ? (
            <div className="flex justify-center border-t px-5 py-4" style={{ borderColor: "var(--hw-card-border)" }}>
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore !== null}
                className="hw-btn-outline flex h-9 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore === tab ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Loading</>
                ) : (
                  <>Load 10 more <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
