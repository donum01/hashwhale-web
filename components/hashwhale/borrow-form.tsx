"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  ASSET_LIST,
  ASSETS,
  INTEREST_RATE_APR,
  MAX_LTV,
  collateralValueUsd,
  computeLtv,
  currencyUsd,
  type AssetSymbol,
  type Loan,
} from "@/lib/borrow"
import { AssetChip } from "./asset-chip"
import { LtvBar } from "./ltv-bar"

export function BorrowForm({ onBorrow }: { onBorrow: (loan: Loan) => void }) {
  const [asset, setAsset] = useState<AssetSymbol>("BTC")
  const [collateral, setCollateral] = useState("")
  const [borrow, setBorrow] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")

  const collateralNum = Number.parseFloat(collateral) || 0
  const borrowNum = Number.parseFloat(borrow) || 0

  const collateralValue = collateralValueUsd(asset, collateralNum)
  const ltv = useMemo(() => computeLtv(collateralValue, borrowNum), [collateralValue, borrowNum])

  const config = ASSETS[asset]
  const overMax = collateralNum > config.maxBalance
  const valid =
    collateralNum > 0 && borrowNum > 0 && !overMax && ltv > 0 && ltv <= MAX_LTV && status === "idle"

  function fillMax() {
    setCollateral(String(config.maxBalance))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setStatus("loading")
    // Simulated network call — swap for a real POST /loans later.
    console.log("[v0] mock borrow submit:", { asset, collateralNum, borrowNum, ltv })
    await new Promise((r) => setTimeout(r, 1100))
    onBorrow({
      id: `ln_${Date.now()}`,
      asset,
      collateralAmount: collateralNum,
      borrowedUsdt: borrowNum,
    })
    setCollateral("")
    setBorrow("")
    setStatus("idle")
  }

  return (
    <div className="hw-card-in hw-card w-full p-6 sm:p-7">
      <h2 className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>
        Create a loan
      </h2>
      <p className="mb-6 mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
        Deposit collateral and borrow USDT instantly.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Collateral asset */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="asset" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
            Collateral asset
          </label>
          <div className="relative">
            <select
              id="asset"
              value={asset}
              onChange={(e) => setAsset(e.target.value as AssetSymbol)}
              className="hw-input h-11 w-full appearance-none pl-3.5 pr-11 text-sm font-medium"
            >
              {ASSET_LIST.map((a) => (
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

        {/* Collateral amount + Max */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="collateral" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
              Collateral amount
            </label>
            <span className="text-xs" style={{ color: overMax ? "var(--hw-error)" : "var(--hw-muted)" }}>
              Balance: {config.maxBalance} {asset}
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
              onChange={(e) => setCollateral(e.target.value)}
              className={`hw-input h-11 w-full pl-10 pr-16 text-sm tabular-nums ${overMax ? "hw-input-error" : ""}`}
            />
            <button
              type="button"
              onClick={fillMax}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold transition-colors"
              style={{ color: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}
            >
              Max
            </button>
          </div>
          {collateralNum > 0 ? (
            <span className="text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
              ≈ {currencyUsd.format(collateralValue)} collateral value
            </span>
          ) : null}
        </div>

        {/* Borrow amount */}
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
              onChange={(e) => setBorrow(e.target.value)}
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

        {/* Live LTV */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--hw-track)", border: "1px solid var(--hw-input-border)" }}
        >
          <LtvBar ltv={ltv} />
          {ltv > MAX_LTV ? (
            <p className="hw-fade-slide mt-3 text-xs font-medium" style={{ color: "var(--hw-error)" }}>
              LTV exceeds the {MAX_LTV}% maximum. Reduce the borrow amount or add collateral.
            </p>
          ) : null}
        </div>

        {/* Static rate */}
        <div
          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--hw-input-bg)", border: "1px solid var(--hw-input-border)" }}
        >
          <span style={{ color: "var(--hw-muted)" }}>Interest rate</span>
          <span className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
            {INTEREST_RATE_APR.toFixed(2)}% APR
          </span>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="hw-submit mt-1 flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm Borrow"
          )}
        </button>
      </form>
    </div>
  )
}
