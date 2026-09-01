"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ArrowRight, CalendarDays, Loader2, ShieldCheck } from "lucide-react"
import { type WalletBalance } from "@/lib/wallet"
import {
  assetAmountFormatter,
  earnTermLabel,
  estimatedProductRewards,
  formatEarnDate,
  type EarnProduct,
} from "@/lib/earn"
import { AssetChip } from "./asset-chip"

type SubscribeResult = { ok: true } | { ok: false; message: string }

function maturityDate(product: EarnProduct): string | null {
  if (product.flexible) return null
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + product.termDays)
  return date.toISOString().slice(0, 10)
}

export function EarnSubscribeForm({
  product,
  balances,
  onSubscribe,
}: {
  product: EarnProduct | null
  balances: WalletBalance[]
  onSubscribe: (productId: string, amount: number) => Promise<SubscribeResult>
}) {
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setAmount("")
    setFormError(null)
  }, [product?.id])

  const amountNumber = Number.parseFloat(amount) || 0
  const available = product
    ? balances.find((balance) => balance.asset === product.asset)?.availableAmount ?? 0
    : 0
  const belowMinimum = Boolean(product && amountNumber > 0 && amountNumber < product.minimumAmount)
  const overBalance = amountNumber > available
  const estimatedRewards = useMemo(
    () => (product && amountNumber > 0 ? estimatedProductRewards(product, amountNumber) : 0),
    [amountNumber, product],
  )
  const valid = Boolean(
    product
      && amountNumber >= product.minimumAmount
      && amountNumber <= available
      && status === "idle",
  )
  const maturity = product ? maturityDate(product) : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !valid) return
    setStatus("loading")
    setFormError(null)
    const result = await onSubscribe(product.id, amountNumber)
    if (result.ok) {
      setAmount("")
    } else {
      setFormError(result.message)
    }
    setStatus("idle")
  }

  return (
    <aside className="hw-card-in hw-card p-6 lg:sticky lg:top-6" aria-labelledby="subscribe-heading">
      <h2 id="subscribe-heading" className="text-lg font-bold" style={{ color: "var(--hw-text)" }}>
        Start earning
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
        Move an available balance into an Earn position.
      </p>

      {!product ? (
        <div
          className="mt-6 rounded-xl p-5 text-center text-sm"
          style={{ background: "var(--hw-track)", color: "var(--hw-muted)" }}
        >
          Select an Earn product to continue.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div
            className="flex items-center justify-between rounded-xl p-4"
            style={{ background: "var(--hw-track)", border: "1px solid var(--hw-input-border)" }}
          >
            <div className="flex items-center gap-3">
              <AssetChip asset={product.asset} size={36} />
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--hw-text)" }}>
                  {product.asset} · {earnTermLabel(product.termType)}
                </p>
                <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
                  {product.flexible ? "Withdraw whenever you need" : `Unlocks after ${product.termDays} days`}
                </p>
              </div>
            </div>
            <span className="text-lg font-bold tabular-nums" style={{ color: "var(--hw-primary)" }}>
              {product.apy.toFixed(2)}%
            </span>
          </div>

          {formError ? (
            <div
              className="hw-fade-slide rounded-lg px-3 py-2.5 text-sm font-medium"
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="earn-amount" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
                Amount
              </label>
              <span
                className="text-xs tabular-nums"
                style={{ color: overBalance ? "var(--hw-error)" : "var(--hw-muted)" }}
              >
                Available: {assetAmountFormatter.format(available)} {product.asset}
              </span>
            </div>
            <div className="relative">
              <input
                id="earn-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={`hw-input h-12 w-full pl-3.5 pr-20 text-sm tabular-nums ${overBalance || belowMinimum ? "hw-input-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setAmount(String(available))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors"
                style={{ color: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}
              >
                Max
              </button>
            </div>
            {belowMinimum ? (
              <p className="text-xs" style={{ color: "var(--hw-error)" }}>
                Minimum is {assetAmountFormatter.format(product.minimumAmount)} {product.asset}.
              </p>
            ) : null}
            {overBalance ? (
              <p className="text-xs" style={{ color: "var(--hw-error)" }}>
                This amount exceeds your available balance.
              </p>
            ) : null}
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "var(--hw-primary-soft)", border: "1px solid var(--hw-input-border)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>
                {product.flexible ? "Estimated rewards / year" : "Estimated reward at maturity"}
              </span>
              <span className="font-bold tabular-nums" style={{ color: "var(--hw-primary)" }}>
                +{assetAmountFormatter.format(estimatedRewards)} {product.asset}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--hw-muted)" }}>
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {maturity ? "Estimated maturity" : "Access"}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--hw-text)" }}>
                {maturity ? formatEarnDate(maturity) : "Any time"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--hw-primary)" }} aria-hidden="true" />
            APY is captured when you subscribe. Rewards use simple daily accrual in this simulation.
          </div>

          <button
            type="submit"
            disabled={!valid}
            className="hw-submit flex h-11 items-center justify-center gap-2 text-sm font-semibold"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Confirming…
              </>
            ) : (
              <>
                Confirm subscription <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      )}
    </aside>
  )
}
