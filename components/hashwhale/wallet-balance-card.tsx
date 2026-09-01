"use client"

import { useState } from "react"
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { currencyUsd, type AssetPricesUsd, type AssetSymbol } from "@/lib/borrow"
import { balanceValueUsd, type WalletBalance } from "@/lib/wallet"
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

  const amountNum = Number.parseFloat(amount) || 0
  const valid = amountNum > 0 && (mode !== "withdraw" || amountNum <= balance.availableAmount)

  function openMode(next: "deposit" | "withdraw") {
    setMode(next)
    setAmount("")
    setError(null)
  }

  function close() {
    setMode("idle")
    setAmount("")
    setError(null)
  }

  async function submit() {
    if (!valid) return
    setStatus("loading")
    setError(null)

    const result =
      mode === "deposit"
        ? await onDeposit(balance.asset, amountNum)
        : await onWithdraw(balance.asset, amountNum)

    if (result.ok) {
      close()
    } else {
      setError(result.message)
    }
    setStatus("idle")
  }

  return (
    <div className="hw-card-hover hw-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetChip asset={balance.asset} size={40} />
          <div>
            <p className="font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
              {balance.availableAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {balance.asset}
            </p>
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
              {balance.availableAmount + balance.lockedAmount > 0
                ? currencyUsd.format(balanceValueUsd(balance, usdPrices))
                : "No balance yet"}
            </p>
          </div>
        </div>
        {balance.lockedAmount > 0 ? (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ color: "var(--hw-muted)", background: "var(--hw-track)" }}
          >
            {balance.lockedAmount} locked
          </span>
        ) : null}
      </div>

      {mode === "idle" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openMode("deposit")}
            className="hw-btn-outline flex h-9 items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Simulate deposit
          </button>
          <button
            type="button"
            onClick={() => openMode("withdraw")}
            className="hw-btn-outline flex h-9 items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Simulate withdrawal
          </button>
        </div>
      ) : (
        <div className="hw-fade-slide mt-4 flex flex-col gap-2.5">
          <p className="text-xs font-medium" style={{ color: "var(--hw-primary)" }}>
            Simulation only — this changes the demo ledger; no real funds move.
          </p>
          {error ? (
            <p className="text-xs font-medium" style={{ color: "var(--hw-error)" }}>
              {error}
            </p>
          ) : null}
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="hw-input h-10 w-full pl-3.5 pr-16 text-sm tabular-nums"
            />
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold"
              style={{ color: "var(--hw-muted)" }}
            >
              {balance.asset}
            </span>
          </div>
          {mode === "withdraw" ? (
            <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
              Available: {balance.availableAmount} {balance.asset}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={close}
              className="hw-btn-outline flex h-9 items-center justify-center text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!valid || status === "loading"}
              className="hw-submit flex h-9 items-center justify-center gap-1.5 text-sm font-semibold"
            >
              {status === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : mode === "deposit" ? (
                "Simulate deposit"
              ) : (
                "Simulate withdrawal"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
