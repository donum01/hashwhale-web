"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  COLLATERAL_ASSET_LIST,
  collateralValueUsd,
  computeLtv,
  type BorrowConfiguration,
  type CollateralAssetSymbol,
  type WalletBalance,
} from "@/lib/borrow"
import { formatAssetAmount, formatRate, usdValueFormatter } from "@/lib/format"
import { AssetChip } from "./asset-chip"
import { LtvBar } from "./ltv-bar"

type BorrowResult = { ok: true } | { ok: false; message: string }

export function BorrowForm({
  onBorrow,
  balances,
  configuration,
}: {
  onBorrow: (params: {
    asset: CollateralAssetSymbol
    collateralAmount: number
    borrowedAmount: number
  }) => Promise<BorrowResult>
  balances: WalletBalance[]
  configuration: BorrowConfiguration
}) {
  const [asset, setAsset] = useState<CollateralAssetSymbol>("BTC")
  const [collateral, setCollateral] = useState("")
  const [borrow, setBorrow] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [formError, setFormError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const collateralNum = Number.parseFloat(collateral) || 0
  const borrowNum = Number.parseFloat(borrow) || 0

  const collateralValue = collateralValueUsd(asset, collateralNum, configuration.usdPrices)
  const borrowedValueUsd = borrowNum * configuration.usdPrices.USDT
  const ltv = useMemo(
    () => computeLtv(collateralValue, borrowedValueUsd),
    [borrowedValueUsd, collateralValue],
  )

  const currentBalance = balances.find((b) => b.asset === asset)?.availableAmount ?? 0

  const overMax = collateralNum > currentBalance
  const valid =
    collateralNum > 0
    && borrowNum > 0
    && !overMax
    && ltv > 0
    && ltv <= configuration.maxLtvPercent
    && status === "idle"

  function fillMax() {
    setCollateral(String(currentBalance))
    setReviewing(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    if (!reviewing) {
      setReviewing(true)
      return
    }
    setStatus("loading")
    setFormError(null)

    const result = await onBorrow({
      asset,
      collateralAmount: collateralNum,
      borrowedAmount: borrowNum,
    })

    if (result.ok) {
      setCollateral("")
      setBorrow("")
      setReviewing(false)
    } else {
      setFormError(result.message)
    }
    setStatus("idle")
  }

  return (
    <div className="hw-card-in hw-card w-full p-6 sm:p-7">
      <h2 className="text-lg font-semibold" style={{ color: "var(--hw-text)" }}>
        Create a loan
      </h2>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
        Choose collateral, enter an amount, and review the resulting LTV.
      </p>

      {formError ? (
        <div
          className="hw-fade-slide mb-4 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            color: "var(--hw-error)",
            background: "rgba(255, 100, 13, 0.1)",
            border: "1px solid rgba(255, 100, 13, 0.3)",
          }}
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="asset" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
            Collateral asset
          </label>
          <div className="relative">
            <select
              id="asset"
              value={asset}
              onChange={(e) => {
                setAsset(e.target.value as CollateralAssetSymbol)
                setReviewing(false)
              }}
              disabled={reviewing}
              className="hw-input h-11 w-full appearance-none pl-3.5 pr-11 text-sm font-medium"
            >
              {COLLATERAL_ASSET_LIST.map((a) => (
                <option key={a.symbol} value={a.symbol} style={{ color: "#0a0e1a" }}>
                  {a.symbol} — {a.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "var(--hw-muted)" }}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="collateral" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
              Collateral amount
            </label>
            <span className="text-xs" style={{ color: overMax ? "var(--hw-error)" : "var(--hw-muted)" }}>
              Balance: {formatAssetAmount(currentBalance, asset)}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <AssetChip asset={asset} size={22} />
            </span>
            <input
              id="collateral"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={collateral}
              onChange={(e) => {
                setCollateral(e.target.value)
                setReviewing(false)
              }}
              disabled={reviewing}
              aria-invalid={overMax}
              aria-describedby={overMax ? "collateral-balance-error" : undefined}
              className={`hw-input h-11 w-full pl-10 pr-16 text-sm tabular-nums ${overMax ? "hw-input-error" : ""}`}
            />
            <button
              type="button"
              onClick={fillMax}
              disabled={reviewing || currentBalance <= 0}
              className="absolute right-0 top-1/2 flex h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-r-lg px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}
            >
              Max
            </button>
          </div>
          {collateralNum > 0 ? (
            <span className="text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
              ≈ {usdValueFormatter.format(collateralValue)} collateral value
            </span>
          ) : null}
          {overMax ? (
            <span id="collateral-balance-error" className="text-xs font-medium" style={{ color: "var(--hw-error)" }}>
              Collateral exceeds your available {asset} balance.
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="borrow" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
            Borrow amount
          </label>
          <div className="relative">
            <input
              id="borrow"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={borrow}
              onChange={(e) => {
                setBorrow(e.target.value)
                setReviewing(false)
              }}
              disabled={reviewing}
              className="hw-input h-11 w-full pl-3.5 pr-16 text-sm tabular-nums"
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold"
              style={{ color: "var(--hw-muted)" }}
            >
              USDT
            </span>
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{ background: "var(--hw-track)", border: "1px solid var(--hw-input-border)" }}
        >
          <LtvBar ltv={ltv} configuration={configuration} />
          {ltv > configuration.maxLtvPercent ? (
            <p className="hw-fade-slide mt-3 text-xs font-medium" style={{ color: "var(--hw-error)" }}>
              LTV exceeds the {configuration.maxLtvPercent}% maximum. Reduce the borrow amount or add collateral.
            </p>
          ) : null}
        </div>

        {reviewing ? (
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-primary-soft)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>Review your loan</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt style={{ color: "var(--hw-muted)" }}>Collateral locked</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(collateralNum, asset)}</dd></div>
              <div><dt style={{ color: "var(--hw-muted)" }}>You receive</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(borrowNum, "USDT")}</dd></div>
              <div><dt style={{ color: "var(--hw-muted)" }}>Opening LTV</dt><dd className="font-semibold tabular-nums">{ltv.toFixed(1)}%</dd></div>
              <div><dt style={{ color: "var(--hw-muted)" }}>Interest rate</dt><dd className="font-semibold tabular-nums">{formatRate(configuration.interestRateApr)} APR</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
              Confirming locks the collateral until this loan is repaid or liquidated.
            </p>
          </div>
        ) : null}

        <div
          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--hw-input-bg)", border: "1px solid var(--hw-input-border)" }}
        >
          <span style={{ color: "var(--hw-muted)" }}>Interest rate</span>
          <span className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
            {formatRate(configuration.interestRateApr)} APR
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {reviewing ? (
            <button type="button" onClick={() => setReviewing(false)} disabled={status === "loading"} className="hw-btn-outline h-11 px-5 text-sm font-semibold sm:flex-1">
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!valid}
            className="hw-submit mt-1 flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold sm:flex-1"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : reviewing ? (
              "Confirm loan"
            ) : (
              "Review loan"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
