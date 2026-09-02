"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ArrowRight, CalendarDays, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import type { AssetSymbol } from "@/lib/borrow"
import type { WalletBalance } from "@/lib/wallet"
import {
  earnTermLabel,
  estimatedProductRewards,
  formatEarnDate,
  type EarnProduct,
} from "@/lib/earn"
import { assetAmountFormatter, formatRate } from "@/lib/format"
import { AssetChip } from "./asset-chip"

type SubscribeResult = { ok: true } | { ok: false; message: string }

function maturityDate(product: EarnProduct): string | null {
  if (product.flexible) return null
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + product.termDays)
  return date.toISOString().slice(0, 10)
}

export function EarnSubscribeForm({
  products,
  selectedProductId,
  balances,
  onSelectProduct,
  onSubscribe,
}: {
  products: EarnProduct[]
  selectedProductId: string | null
  balances: WalletBalance[]
  onSelectProduct: (productId: string) => void
  onSubscribe: (productId: string, amount: number) => Promise<SubscribeResult>
}) {
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [formError, setFormError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const activeProducts = useMemo(() => products.filter((product) => product.active), [products])
  const product = activeProducts.find((candidate) => candidate.id === selectedProductId) ?? null
  const assets = useMemo(
    () => Array.from(new Set(activeProducts.map((candidate) => candidate.asset))),
    [activeProducts],
  )
  const productsForAsset = product
    ? activeProducts.filter((candidate) => candidate.asset === product.asset)
    : []

  useEffect(() => {
    setAmount("")
    setFormError(null)
    setReviewing(false)
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

  function selectAsset(asset: AssetSymbol) {
    const matchingProducts = activeProducts.filter((candidate) => candidate.asset === asset)
    const matchingTerm = matchingProducts.find((candidate) => candidate.termType === product?.termType)
    const nextProduct = matchingTerm ?? matchingProducts[0]
    if (nextProduct) onSelectProduct(nextProduct.id)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product || !valid) return
    if (!reviewing) {
      setReviewing(true)
      return
    }
    setStatus("loading")
    setFormError(null)
    const result = await onSubscribe(product.id, amountNumber)
    if (result.ok) {
      setAmount("")
      setReviewing(false)
    }
    else setFormError(result.message)
    setStatus("idle")
  }

  return (
    <section className="hw-card overflow-hidden" aria-labelledby="subscribe-heading">
      <div className="hw-panel-header">
        <div>
          <h2 id="subscribe-heading" className="text-lg font-semibold" style={{ color: "var(--hw-text)" }}>
            Start earning
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>
            Configure a position and review the terms before confirming.
          </p>
        </div>
      </div>

      {!product ? (
        <div className="p-6 text-sm" style={{ color: "var(--hw-muted)" }}>
          No Earn products are currently available.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            {formError ? (
              <div
                className="hw-fade-slide rounded-lg px-3 py-2.5 text-sm font-medium"
                style={{
                  color: "var(--hw-error)",
                  background: "color-mix(in srgb, var(--hw-error) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--hw-error) 28%, transparent)",
                }}
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="earn-asset" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
                  Asset
                </label>
                <select
                  id="earn-asset"
                  value={product.asset}
                  onChange={(event) => selectAsset(event.target.value as AssetSymbol)}
                  disabled={reviewing}
                  className="hw-input h-11 w-full px-3 text-sm font-medium"
                >
                  {assets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="earn-term" className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
                  Term
                </label>
                <select
                  id="earn-term"
                  value={product.id}
                  onChange={(event) => onSelectProduct(event.target.value)}
                  disabled={reviewing}
                  className="hw-input h-11 w-full px-3 text-sm font-medium"
                >
                  {productsForAsset.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {earnTermLabel(candidate.termType)} · {formatRate(candidate.apy)} APY
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                  onChange={(event) => {
                    setAmount(event.target.value)
                    setReviewing(false)
                  }}
                  disabled={reviewing}
                  className={`hw-input h-12 w-full pl-3.5 pr-20 text-sm tabular-nums ${overBalance || belowMinimum ? "hw-input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAmount(String(available))
                    setReviewing(false)
                  }}
                  disabled={available <= 0 || reviewing}
                  className="absolute right-0 top-1/2 flex h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-r-lg px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--hw-primary)" }} aria-hidden="true" />
              APY is fixed when the position is created. Rewards use simple daily accrual in this demo ledger.
            </div>

            {reviewing ? (
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-primary-soft)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>Ready to open this position</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
                  Confirm {assetAmountFormatter.format(amountNumber)} {product.asset} at {formatRate(product.apy)} APY for the {earnTermLabel(product.termType).toLowerCase()} term.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {reviewing ? (
                <button type="button" onClick={() => setReviewing(false)} disabled={status === "loading"} className="hw-btn-outline h-11 px-5 text-sm font-semibold sm:flex-1">
                  Back
                </button>
              ) : null}
              <button
                type="submit"
                disabled={!valid}
                className="hw-submit flex h-11 items-center justify-center gap-2 text-sm font-semibold sm:flex-1 sm:px-6"
              >
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Confirming</>
                ) : reviewing ? (
                  <>Confirm position <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                ) : (
                  <>Review position <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>
            </div>
          </div>

          <aside
            className="border-t p-5 sm:p-6 lg:border-l lg:border-t-0"
            style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-track)" }}
            aria-label="Earn position preview"
          >
            <p className="hw-eyebrow">Position preview</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AssetChip asset={product.asset} size={40} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>{product.asset} Earn</p>
                  <p className="text-xs" style={{ color: "var(--hw-muted)" }}>{earnTermLabel(product.termType)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums" style={{ color: "var(--hw-primary)" }}>
                  {formatRate(product.apy)}
                </p>
                <p className="text-[11px] font-medium" style={{ color: "var(--hw-muted)" }}>APY</p>
              </div>
            </div>

            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt style={{ color: "var(--hw-muted)" }}>Minimum</dt>
                <dd className="font-semibold tabular-nums">
                  {assetAmountFormatter.format(product.minimumAmount)} {product.asset}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt style={{ color: "var(--hw-muted)" }}>
                  {product.flexible ? "Estimated annual reward" : "Estimated maturity reward"}
                </dt>
                <dd className="font-semibold tabular-nums" style={{ color: "var(--hw-ltv-safe)" }}>
                  +{assetAmountFormatter.format(estimatedRewards)} {product.asset}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-1.5" style={{ color: "var(--hw-muted)" }}>
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {maturity ? "Maturity" : "Withdrawal"}
                </dt>
                <dd className="font-semibold">{maturity ? formatEarnDate(maturity) : "Any time"}</dd>
              </div>
            </dl>
            {maturity ? (
              <div
                className="mt-5 flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed"
                style={{ borderColor: "var(--hw-card-border)", background: "var(--hw-input-bg)", color: "var(--hw-text)" }}
              >
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--hw-ltv-warn)" }} aria-hidden="true" />
                <p>
                  <span className="font-semibold">Funds locked until {formatEarnDate(maturity)}.</span>{" "}
                  Early withdrawal is unavailable for this fixed-term position.
                </p>
              </div>
            ) : null}
          </aside>
        </form>
      )}
    </section>
  )
}
