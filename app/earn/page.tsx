"use client"

import { useEffect, useRef, useState } from "react"
import { AppShell } from "@/components/hashwhale/app-shell"
import { EarnPositions } from "@/components/hashwhale/earn-positions"
import { EarnSubscribeForm } from "@/components/hashwhale/earn-subscribe-form"
import { EarnSummary } from "@/components/hashwhale/earn-summary"
import { Toast, type ToastVariant } from "@/components/hashwhale/toast"
import { TransactionHistory } from "@/components/hashwhale/transaction-history"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { api } from "@/lib/api"
import {
  apiEarnPositionToEarnPosition,
  apiEarnProductToEarnProduct,
  apiEarnSummaryToEarnSummary,
  type EarnPosition,
  type EarnProduct,
  type EarnSummary as EarnSummaryData,
} from "@/lib/earn"
import { HISTORY_BATCH_SIZE, historyPageState, type HistoryPageState } from "@/lib/history"
import {
  apiBalanceToBalance,
  apiTransactionToTransaction,
  type WalletBalance,
  type WalletTransaction,
} from "@/lib/wallet"
import { useAuthUser } from "@/lib/use-auth-user"

const EMPTY_HISTORY_PAGE: HistoryPageState = { hasMore: false, nextCursor: null }
const EARN_TRANSACTION_TYPES = ["EARN_SUBSCRIBE", "EARN_WITHDRAW"] as const

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

function appendUniquePositions(current: EarnPosition[], next: EarnPosition[]): EarnPosition[] {
  const knownIds = new Set(current.map((position) => position.id))
  return [...current, ...next.filter((position) => !knownIds.has(position.id))]
}

export default function EarnPage() {
  const { theme, toggleTheme } = useTheme()
  const [products, setProducts] = useState<EarnProduct[]>([])
  const [activePositions, setActivePositions] = useState<EarnPosition[]>([])
  const [historyPositions, setHistoryPositions] = useState<EarnPosition[]>([])
  const [activePage, setActivePage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [historyPage, setHistoryPage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [summary, setSummary] = useState<EarnSummaryData | null>(null)
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [transactionPage, setTransactionPage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMorePositions, setLoadingMorePositions] = useState<"ACTIVE" | "HISTORY" | null>(null)
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { userId, authReady } = useAuthUser()

  function showToast(message: string, variant: ToastVariant = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, variant })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  async function refreshData() {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const [productsResponse, activeResponse, historyResponse, summaryResponse, balancesResponse, transactionsResponse] =
        await Promise.all([
          api.GET("/api/earn/products", { cache: "no-store" }),
          api.GET("/api/earn/positions", {
            params: { query: { limit: HISTORY_BATCH_SIZE, status: ["ACTIVE"] } },
            cache: "no-store",
          }),
          api.GET("/api/earn/positions", {
            params: { query: { limit: HISTORY_BATCH_SIZE, status: ["WITHDRAWN"] } },
            cache: "no-store",
          }),
          api.GET("/api/earn/summary", { cache: "no-store" }),
          api.GET("/api/wallet/balances", { cache: "no-store" }),
          api.GET("/api/wallet/transactions", {
            params: { query: { limit: HISTORY_BATCH_SIZE, type: [...EARN_TRANSACTION_TYPES] } },
            cache: "no-store",
          }),
        ])

      const hasError = productsResponse.error
        || activeResponse.error
        || historyResponse.error
        || summaryResponse.error
        || balancesResponse.error
        || transactionsResponse.error

      if (
        hasError
        || !productsResponse.data
        || !activeResponse.data
        || !historyResponse.data
        || !summaryResponse.data
        || !balancesResponse.data
        || !transactionsResponse.data
      ) {
        setLoadError("Could not load Earn data. Please try again.")
        return
      }

      const nextProducts = productsResponse.data.map(apiEarnProductToEarnProduct)
      const nextBalances = balancesResponse.data.map(apiBalanceToBalance)
      setProducts(nextProducts)
      setActivePositions(activeResponse.data.map(apiEarnPositionToEarnPosition))
      setHistoryPositions(historyResponse.data.map(apiEarnPositionToEarnPosition))
      setActivePage(historyPageState(activeResponse.response, activeResponse.data.length))
      setHistoryPage(historyPageState(historyResponse.response, historyResponse.data.length))
      setSummary(apiEarnSummaryToEarnSummary(summaryResponse.data))
      setBalances(nextBalances)
      setTransactions(transactionsResponse.data.map(apiTransactionToTransaction))
      setTransactionPage(historyPageState(transactionsResponse.response, transactionsResponse.data.length))
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
    if (!authReady) return
    void refreshData()
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId])

  async function loadMorePositions(kind: "ACTIVE" | "HISTORY") {
    const page = kind === "ACTIVE" ? activePage : historyPage
    if (!page.hasMore || page.nextCursor == null || loadingMorePositions) return
    setLoadingMorePositions(kind)
    const status = kind === "ACTIVE" ? "ACTIVE" : "WITHDRAWN"

    try {
      const response = await api.GET("/api/earn/positions", {
        params: {
          query: { limit: HISTORY_BATCH_SIZE, beforeId: page.nextCursor, status: [status] },
        },
        cache: "no-store",
      })
      if (response.error || !response.data) {
        showToast("Could not load more Earn positions", "error")
        return
      }

      const nextPositions = response.data.map(apiEarnPositionToEarnPosition)
      if (kind === "ACTIVE") {
        setActivePositions((current) => appendUniquePositions(current, nextPositions))
        setActivePage(historyPageState(response.response, response.data.length))
      } else {
        setHistoryPositions((current) => appendUniquePositions(current, nextPositions))
        setHistoryPage(historyPageState(response.response, response.data.length))
      }
    } catch {
      showToast("Could not reach the Earn service", "error")
    } finally {
      setLoadingMorePositions(null)
    }
  }

  async function loadMoreTransactions() {
    if (!transactionPage.hasMore || transactionPage.nextCursor == null || loadingMoreTransactions) return
    setLoadingMoreTransactions(true)
    try {
      const response = await api.GET("/api/wallet/transactions", {
        params: {
          query: {
            limit: HISTORY_BATCH_SIZE,
            beforeId: transactionPage.nextCursor,
            type: [...EARN_TRANSACTION_TYPES],
          },
        },
        cache: "no-store",
      })
      if (response.error || !response.data) {
        showToast("Could not load more Earn activity", "error")
        return
      }
      setTransactions((current) => [...current, ...response.data.map(apiTransactionToTransaction)])
      setTransactionPage(historyPageState(response.response, response.data.length))
    } catch {
      showToast("Could not reach the wallet service", "error")
    } finally {
      setLoadingMoreTransactions(false)
    }
  }

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

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      {!authReady || loading ? (
        <div className="flex items-center gap-3 py-12 text-sm" style={{ color: "var(--hw-muted)" }}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: "var(--hw-primary)" }} />
          Loading Earn products and positions…
        </div>
      ) : !userId ? (
        <p className="text-sm" style={{ color: "var(--hw-error)" }}>
          Please log in to access Earn.
        </p>
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
        <div className="flex flex-col gap-7">
          <section className="hw-page-header" aria-labelledby="earn-heading">
            <div>
              <p className="hw-eyebrow">Yield products</p>
              <h1 id="earn-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--hw-text)" }}>
                Earn
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--hw-muted)" }}>
                Choose an asset and term, preview the return, and create a simulated yield position.
              </p>
            </div>
            <div
              className="rounded-lg border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: "var(--hw-card-border)", color: "var(--hw-muted)", background: "var(--hw-card)" }}
            >
              APY · simple daily accrual
            </div>
          </section>

          <EarnSummary summary={summary} />
          <EarnSubscribeForm
            products={products}
            selectedProductId={selectedProductId}
            balances={balances}
            onSelectProduct={setSelectedProductId}
            onSubscribe={handleSubscribe}
          />
          <EarnPositions
            activePositions={activePositions}
            historyPositions={historyPositions}
            activeHasMore={activePage.hasMore}
            historyHasMore={historyPage.hasMore}
            loadingMore={loadingMorePositions}
            onLoadMoreActive={() => void loadMorePositions("ACTIVE")}
            onLoadMoreHistory={() => void loadMorePositions("HISTORY")}
            onWithdraw={handleWithdraw}
          />
          <TransactionHistory
            transactions={transactions}
            title="Earn activity"
            hasMore={transactionPage.hasMore}
            loadingMore={loadingMoreTransactions}
            onLoadMore={() => void loadMoreTransactions()}
          />
        </div>
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      </div>
    </AppShell>
  )
}
