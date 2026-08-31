"use client"

import { useState } from "react"
import { Loader2, Wallet } from "lucide-react"
import {
  currencyUsd,
  currencyUsdPrecise,
  liquidationPrice,
  loanLtv,
  ltvTier,
  ltvTierColorVar,
  type Loan,
} from "@/lib/borrow"
import { AssetChip } from "./asset-chip"

function LtvBadge({ ltv }: { ltv: number }) {
  const tier = ltvTier(ltv)
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

function LoanCard({ loan, onRepay }: { loan: Loan; onRepay: (id: string) => void }) {
  const [repaying, setRepaying] = useState(false)
  const ltv = loanLtv(loan)
  const liq = liquidationPrice(loan)
  const showLiqWarning = ltv > 60

  async function repay() {
    setRepaying(true)
    console.log("[v0] mock repay:", loan.id)
    await new Promise((r) => setTimeout(r, 900))
    onRepay(loan.id)
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
        <LtvBadge ltv={ltv} />
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

export function ActiveLoans({ loans, onRepay }: { loans: Loan[]; onRepay: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>
          Your Active Loans
        </h2>
        {loans.length > 0 ? (
          <span className="text-sm tabular-nums" style={{ color: "var(--hw-muted)" }}>
            {loans.length} open
          </span>
        ) : null}
      </div>

      {loans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} onRepay={onRepay} />
          ))}
        </div>
      )}
    </div>
  )
}
