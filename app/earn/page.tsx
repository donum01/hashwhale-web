"use client"

import { useEffect, useRef, useState } from "react"
import { Info, Sparkles } from "lucide-react"
import { EarnPositions } from "@/components/hashwhale/earn-positions"
import { EarnProductCatalog } from "@/components/hashwhale/earn-product-catalog"
import { EarnSubscribeForm } from "@/components/hashwhale/earn-subscribe-form"
import { EarnSummary } from "@/components/hashwhale/earn-summary"
import { Nav } from "@/components/hashwhale/nav"
import { Toast } from "@/components/hashwhale/toast"
import { TransactionHistory } from "@/components/hashwhale/transaction-history"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { api } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import {
  apiEarnPositionToEarnPosition,
  apiEarnProductToEarnProduct,
  apiEarnSummaryToEarnSummary,
  type EarnPosition,
  type EarnProduct,
  type EarnSummary as EarnSummaryData,
} from "@/lib/earn"
import {
  apiBalanceToBalance,
  apiTransactionToTransaction,
  type WalletBalance,
  type WalletTransaction,
} from "@/lib/wallet"

function preferredProduct(products: EarnProduct[], balances: WalletBalance[]): EarnProduct | null {
  const affordable = products.find((product) => {
    const available = balances.find((balance) => balance.asset === product.asset)?.availableAmount ?? 0
    return product.active && available >= product.minimumAmount
  })
  return affordable
    ?? products.find((product) => product.asset === "USDT" && product.termType === "FLEXIBLE")
    ?? products.find((product) => product.active)
    ?? null
}

export default function EarnPage() {
  const { theme, toggleTheme } = useTheme()
  const [products, setProducts] = useState<EarnProduct[]>([])
  const [positions, setPositions] = useState<EarnPosition[]>([])
  const [summary, setSummary] = useState<EarnSummaryData | null>(null)
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userId = getUserId()

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  async function refreshData() {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const [productsResponse, positionsResponse, summaryResponse, balancesResponse, transactionsResponse] =
        await Promise.all([
          api.GET("/api/earn/products", { cache: "no-store" }),
          api.GET("/api/earn/positions", { cache: "no-store" }),
          api.GET("/api/earn/summary", { cache: "no-store" }),
          api.GET("/api/wallet/balances", { cache: "no-store" }),
          api.GET("/api/wallet/transactions", { cache: "no-store" }),
        ])

      const hasError = productsResponse.error
        || positionsResponse.error
        || summaryResponse.error
        || balancesResponse.error
        || transactionsResponse.error

      if (hasError || !productsResponse.data || !positionsResponse.data || !summaryResponse.data || !balancesResponse.data) {
        setLoadError("Could not load Earn data. Please try again.")
        return
      }

      const nextProducts = productsResponse.data.map(apiEarnProductToEarnProduct)
      const nextBalances = balancesResponse.data.map(apiBalanceToBalance)
      setProducts(nextProducts)
      setPositions(positionsResponse.data.map(apiEarnPositionToEarnPosition))
      setSummary(apiEarnSummaryToEarnSummary(summaryResponse.data))
      setBalances(nextBalances)
      setTransactions(
        (transactionsResponse.data ?? [])
          .map(apiTransactionToTransaction)
          .filter((transaction) => transaction.type === "EARN_SUBSCRIBE" || transaction.type === "EARN_WITHDRAW"),
      )
      setSelectedProductId((current) => {
        if (current && nextProducts.some((product) => product.id === current && product.active)) return current
        return preferredProduct(nextProducts, nextBalances)?.id ?? null
      })
      setLoadError(null)
    } catch {
      setLoadError("Could not reach the Earn service. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshData()
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleSubscribe(productId: string, amount: number) {
    try {
      const { data, error } = await api.POST("/api/earn/positions", {
        body: { productId, amount },
      })
      if (error || !data) {
        const message = (error as { message?: string } | undefined)?.message ?? "Could not create the Earn position."
        return { ok: false as const, message }
      }
      await refreshData()
      showToast(`${data.asset} Earn position started`)
      return { ok: true as const }
    } catch {
      return { ok: false as const, message: "Could not reach the Earn service." }
    }
  }

  async function handleWithdraw(positionId: number) {
    try {
      const { data, error } = await api.POST("/api/earn/positions/{positionId}/withdraw", {
        params: { path: { positionId } },
      })
      if (error || !data) {
        const message = (error as { message?: string } | undefined)?.message ?? "Could not withdraw this position."
        return { ok: false as const, message }
      }
      await refreshData()
      showToast(`${data.asset} principal and rewards returned to Wallet`)
      return { ok: true as const }
    } catch {
      return { ok: false as const, message: "Could not reach the Earn service." }
    }
  }

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative min-h-svh overflow-hidden transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div className="hw-glow pointer-events-none absolute left-1/2 top-0 h-[560px] w-[560px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <Nav theme={theme} onToggleTheme={toggleTheme} />
        </header>

        {!userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Please log in to access Earn.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-3 py-12 text-sm" style={{ color: "var(--hw-muted)" }}>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: "var(--hw-primary)" }} />
            Loading Earn products and positions…
          </div>
        ) : loadError || !summary ? (
          <div className="hw-card max-w-lg p-6">
            <p className="text-sm font-semibold" style={{ color: "var(--hw-error)" }}>{loadError ?? "Earn is unavailable."}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                void refreshData()
              }}
              className="hw-btn-outline mt-4 px-4 py-2 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <section className="hw-card-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--hw-primary)" }}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Grow idle balances
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--hw-text)" }}>
                  Earn
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--hw-muted)" }}>
                  Choose flexible access or lock assets for a fixed term. Track rewards and maturity from one place.
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
              >
                APY · simple daily accrual
              </div>
            </section>

            <div
              className="hw-card flex items-start gap-3 p-4"
              style={{ borderColor: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}
              role="note"
              aria-label="Earn simulation notice"
            >
              <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--hw-primary)" }} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--hw-text)" }}>Simulation mode</p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
                  Earn products, rates, and rewards are simulated in the internal ledger. No real assets are invested, staked, or transferred on-chain.
                </p>
              </div>
            </div>

            <EarnSummary summary={summary} />

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <EarnProductCatalog
                products={products}
                selectedProductId={selectedProductId}
                onSelect={setSelectedProductId}
              />
              <EarnSubscribeForm product={selectedProduct} balances={balances} onSubscribe={handleSubscribe} />
            </div>

            <EarnPositions positions={positions} onWithdraw={handleWithdraw} />
            <TransactionHistory transactions={transactions} title="Earn activity" />
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast} /> : null}
      </div>
    </main>
  )
}