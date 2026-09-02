"use client"

import { useState } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { ASSETS, type AssetPricesUsd, type AssetSymbol } from "@/lib/borrow"
import { formatAssetAmount, usdValueFormatter } from "@/lib/format"
import { assetAmountValueUsd, type WalletBalance } from "@/lib/wallet"
import { AssetChip } from "./asset-chip"

type ActionResult = { ok: true } | { ok: false; message: string }

export function WalletBalanceCard({
  balance,
  usdPrices,
  onDeposit,
  onWithdraw,
}: {
  balance: WalletBalance
  usdPrices: AssetPricesUsd
  onDeposit: (asset: AssetSymbol, amount: number) => Promise<ActionResult>
  onWithdraw: (asset: AssetSymbol, amount: number) => Promise<ActionResult>
}) {
  const [mode, setMode] = useState<"idle" | "deposit" | "withdraw">("idle")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [error, setError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const amountNum = Number.parseFloat(amount) || 0
  const exceedsAvailable = mode === "withdraw" && amountNum > balance.availableAmount
  const valid = amountNum > 0 && !exceedsAvailable
  const inputId = `wallet-${balance.asset.toLowerCase()}-${mode}-amount`
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const availableValue = assetAmountValueUsd(balance.asset, balance.availableAmount, usdPrices)
  const lockedValue = assetAmountValueUsd(balance.asset, balance.lockedAmount, usdPrices)
  const resultingAvailable = mode === "deposit"
    ? balance.availableAmount + amountNum
    : balance.availableAmount - amountNum

  function openMode(next: "deposit" | "withdraw") {
    setMode(next)
    setAmount("")
    setError(null)
    setReviewing(false)
  }

  function close() {
    setMode("idle")
    setAmount("")
    setError(null)
    setReviewing(false)
  }

  async function submit() {
    if (!valid) return
    setStatus("loading")
    setError(null)
    const result = mode === "deposit"
      ? await onDeposit(balance.asset, amountNum)
      : await onWithdraw(balance.asset, amountNum)

    if (result.ok) close()
    else setError(result.message)
    setStatus("idle")
  }

  return (
    <div className="hw-data-row p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3 lg:w-52">
          <AssetChip asset={balance.asset} size={40} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>
              {ASSETS[balance.asset].name}
            </p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>{balance.asset}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:text-right">
          <p className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>Available</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--hw-text)" }}>
            {formatAssetAmount(balance.availableAmount, balance.asset)}
          </p>
          <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
            {usdValueFormatter.format(availableValue)} available value
          </p>
        </div>

        {balance.lockedAmount > 0 ? (
          <div className="min-w-0 flex-1 lg:text-right">
            <p className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>Locked</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums" style={{ color: "var(--hw-text)" }}>
              {formatAssetAmount(balance.lockedAmount, balance.asset)}
            </p>
            <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--hw-muted)" }}>
              {usdValueFormatter.format(lockedValue)} locked value
            </p>
          </div>
        ) : null}

        {mode === "idle" ? (
          <div className="flex gap-2 lg:ml-2">
            <button
              type="button"
              onClick={() => openMode("deposit")}
              className="hw-btn-outline flex h-11 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-semibold lg:flex-none"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
            </button>
            <button
              type="button"
              onClick={() => openMode("withdraw")}
              className="hw-btn-outline flex h-11 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-semibold lg:flex-none"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
            </button>
          </div>
        ) : null}
      </div>

      {mode !== "idle" ? (
        <div className="hw-fade-slide mt-4 border-t pt-4" style={{ borderColor: "var(--hw-card-border)" }}>
          <div className="max-w-xl sm:ml-auto">
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--hw-primary)" }}>
              Demo ledger only. No real funds move.
            </p>
            {error ? <p id={errorId} className="mb-2 text-xs font-medium" style={{ color: "var(--hw-error)" }} role="alert">{error}</p> : null}
            {!reviewing ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium" style={{ color: "var(--hw-text)" }}>
                  {mode === "deposit" ? "Deposit" : "Withdrawal"} amount
                </label>
                <div className="relative">
                <input
                  id={inputId}
                  name={`${mode}Amount`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value)
                    setError(null)
                  }}
                  aria-invalid={exceedsAvailable || Boolean(error)}
                  aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
                  className={`hw-input h-11 w-full pl-3.5 pr-16 text-sm tabular-nums ${exceedsAvailable ? "hw-input-error" : ""}`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: "var(--hw-muted)" }}>
                  {balance.asset}
                </span>
              </div>
              </div>
              <button type="button" onClick={close} className="hw-btn-outline h-11 px-4 text-sm font-semibold">Cancel</button>
              <button
                type="button"
                onClick={() => setReviewing(true)}
                disabled={!valid}
                className="hw-submit flex h-11 items-center justify-center gap-1.5 px-4 text-sm font-semibold"
              >
                Review {mode === "deposit" ? "deposit" : "withdrawal"}
              </button>
            </div>
            ) : (
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-track)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>Review simulated {mode}</p>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div><dt style={{ color: "var(--hw-muted)" }}>Amount</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(amountNum, balance.asset)}</dd></div>
                  <div><dt style={{ color: "var(--hw-muted)" }}>Available after</dt><dd className="font-semibold tabular-nums">{formatAssetAmount(resultingAvailable, balance.asset)}</dd></div>
                </dl>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setReviewing(false)} disabled={status === "loading"} className="hw-btn-outline h-11 px-4 text-sm font-semibold">Back</button>
                  <button type="button" onClick={submit} disabled={status === "loading"} className="hw-submit flex h-11 items-center justify-center gap-1.5 px-4 text-sm font-semibold">
                    {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                    Confirm {mode === "deposit" ? "deposit" : "withdrawal"}
                  </button>
                </div>
              </div>
            )}
            {mode === "withdraw" ? (
              <p id={helpId} className="mt-2 text-xs" style={{ color: exceedsAvailable ? "var(--hw-error)" : "var(--hw-muted)" }} aria-live="polite">
                {exceedsAvailable
                  ? `Amount exceeds your available balance of ${formatAssetAmount(balance.availableAmount, balance.asset)}.`
                  : `Available: ${formatAssetAmount(balance.availableAmount, balance.asset)}`}
              </p>
            ) : <p id={helpId} className="sr-only">Enter the amount of {balance.asset} to add to the simulated ledger.</p>}
          </div>
        </div>
      ) : null}
    </div>
  )
}
