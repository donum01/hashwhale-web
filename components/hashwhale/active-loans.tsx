"use client"

import { useState } from "react"
import { CalendarClock, Loader2, Wallet } from "lucide-react"
import {
  currencyUsd,
  currencyUsdPrecise,
  loanDateTimeFormatter,
  liquidationPrice,
  loanLtv,
  ltvTier,
  ltvTierColorVar,
  type BorrowConfiguration,
  type Loan,
} from "@/lib/borrow"
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

function LoanCard({
  loan,
  configuration,
  onRepay,
}: {
  loan: Loan
  configuration: BorrowConfiguration
  onRepay: (id: number) => Promise<void>
}) {
  const [repaying, setRepaying] = useState(false)
  const ltv = loanLtv(loan, configuration)
  const liq = liquidationPrice(loan, configuration)
  const showLiqWarning = ltv >= configuration.warningLtvPercent

  async function repay() {
    setRepaying(true)
    await onRepay(loan.id)
    setRepaying(false)
  }

  return (
    <div className="hw-card-hover hw-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetChip asset={loan.asset} size={40} />
          <div>
            <p className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
              {loan.collateralAmount} {loan.asset}
            </p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
              Collateral
            </p>
          </div>
        </div>
        <LtvBadge ltv={ltv} configuration={configuration} />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
            Borrowed
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
            {currencyUsd.format(loan.borrowedUsdt)}{" "}
            <span className="text-xs font-semibold" style={{ color: "var(--hw-muted)" }}>
              USDT
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={repay}
          disabled={repaying}
          className="hw-btn-outline flex h-9 items-center justify-center gap-1.5 px-4 text-sm font-semibold disabled:opacity-60"
        >
          {repaying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Repaying…
            </>
          ) : (
            "Repay"
          )}
        </button>
      </div>

      <p
        className="mt-3 text-xs font-medium tabular-nums"
        style={{ color: showLiqWarning ? "var(--hw-error)" : "var(--hw-muted)" }}
      >
        Liquidation price: {currencyUsdPrecise.format(liq)}
      </p>
      <p className="mt-1 text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
        Interest rate: {loan.interestRateApr.toFixed(2)}% APR
      </p>
      <p
        className="mt-2 flex items-center gap-1.5 text-xs"
        style={{ color: "var(--hw-muted)" }}
      >
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Opened</span>
        <time dateTime={loan.createdAt}>{loanDateTimeFormatter.format(new Date(loan.createdAt))}</time>
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="hw-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
      style={{ borderStyle: "dashed" }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
      >
        <Wallet className="h-6 w-6" />
      </span>
      <p className="font-semibold" style={{ color: "var(--hw-text)" }}>
        No active loans yet
      </p>
      <p className="max-w-[240px] text-sm leading-relaxed" style={{ color: "var(--hw-muted)" }}>
        Deposit collateral in the form to borrow USDT. Your open positions will appear here.
      </p>
    </div>
  )
}

export function ActiveLoans({
  loans,
  configuration,
  onRepay,
}: {
  loans: Loan[]
  configuration: BorrowConfiguration
  onRepay: (id: number) => Promise<void>
}) {
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>
          Your Active Loans
        </h2>
        {activeLoans.length > 0 ? (
          <span className="text-sm tabular-nums" style={{ color: "var(--hw-muted)" }}>
            {activeLoans.length} open
          </span>
        ) : null}
      </div>

      {activeLoans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          {activeLoans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} configuration={configuration} onRepay={onRepay} />
          ))}
        </div>
      )}
    </div>
  )
}
