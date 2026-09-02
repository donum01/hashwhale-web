"use client"

import { useEffect, useRef, useState } from "react"
import { AppShell } from "@/components/hashwhale/app-shell"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { Toast, type ToastVariant } from "@/components/hashwhale/toast"
import { TransactionHistory } from "@/components/hashwhale/transaction-history"
import { WalletBalanceCard } from "@/components/hashwhale/wallet-balance-card"
import {
  apiBorrowConfigurationToBorrowConfiguration,
  PRICE_CONFIGURATION_POLL_MS,
  type AssetSymbol,
  type BorrowConfiguration,
} from "@/lib/borrow"
import { usdValueFormatter } from "@/lib/format"
import {
  apiBalanceToBalance,
  apiTransactionToTransaction,
  totalPortfolioValue,
  withAllAssets,
  type WalletBalance,
  type WalletTransaction,
} from "@/lib/wallet"
import { api } from "@/lib/api"
import { HISTORY_BATCH_SIZE, historyPageState, type HistoryPageState } from "@/lib/history"
import { PriceStatus } from "@/components/hashwhale/price-status"
import { useAuthUser } from "@/lib/use-auth-user"

const EMPTY_HISTORY_PAGE: HistoryPageState = { hasMore: false, nextCursor: null }

export default function WalletPage() {
  const { theme, toggleTheme } = useTheme()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [transactionPage, setTransactionPage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false)
  const [configuration, setConfiguration] = useState<BorrowConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
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
    const [balancesRes, txRes, configurationRes] = await Promise.all([
      api.GET("/api/wallet/balances"),
      api.GET("/api/wallet/transactions", {
        params: { query: { limit: HISTORY_BATCH_SIZE } },
        cache: "no-store",
      }),
      api.GET("/api/borrow/configuration", { cache: "no-store" }),
    ])
    if (balancesRes.data) setBalances(balancesRes.data.map(apiBalanceToBalance))
    if (txRes.data) {
      setTransactions(txRes.data.map(apiTransactionToTransaction))
      setTransactionPage(historyPageState(txRes.response, txRes.data.length))
    }
    if (configurationRes.data) {
      setConfiguration(apiBorrowConfigurationToBorrowConfiguration(configurationRes.data))
    }
    if (balancesRes.error || txRes.error || configurationRes.error) showToast("Could not load wallet data", "error")
    setLoading(false)
  }

  useEffect(() => {
    if (!authReady) return
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId])

  async function loadMoreTransactions() {
    if (!transactionPage.hasMore || transactionPage.nextCursor == null || loadingMoreTransactions) return
    setLoadingMoreTransactions(true)
    try {
      const response = await api.GET("/api/wallet/transactions", {
        params: {
          query: { limit: HISTORY_BATCH_SIZE, beforeId: transactionPage.nextCursor },
        },
        cache: "no-store",
      })
      if (response.error || !response.data) {
        showToast("Could not load more wallet activity", "error")
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

  useEffect(() => {
    if (!authReady || !userId) return

    const refreshConfiguration = () => {
      void (async () => {
        try {
          const { data } = await api.GET("/api/borrow/configuration", { cache: "no-store" })
          if (data) setConfiguration(apiBorrowConfigurationToBorrowConfiguration(data))
        } catch {
          // Retain the last known snapshot when a background refresh cannot reach the API.
        }
      })()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshConfiguration()
    }

    const intervalId = window.setInterval(refreshConfiguration, PRICE_CONFIGURATION_POLL_MS)
    window.addEventListener("focus", refreshConfiguration)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshConfiguration)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [authReady, userId])

  async function handleDeposit(asset: AssetSymbol, amount: number) {
    if (!userId) return { ok: false as const, message: "You must be logged in." }
    const { error } = await api.POST("/api/wallet/deposit", {
      body: { asset, amount },
    })
    if (error) {
      const message = (error as { message?: string })?.message ?? "Simulated deposit failed."
      return { ok: false as const, message }
    }
    await refreshData()
    showToast(`Simulated deposit: ${amount} ${asset}`)
    return { ok: true as const }
  }

  async function handleWithdraw(asset: AssetSymbol, amount: number) {
    if (!userId) return { ok: false as const, message: "You must be logged in." }
    const { error } = await api.POST("/api/wallet/withdraw", {
      body: { asset, amount },
    })
    if (error) {
      const message = (error as { message?: string })?.message ?? "Simulated withdrawal failed."
      return { ok: false as const, message }
    }
    await refreshData()
    showToast(`Simulated withdrawal: ${amount} ${asset}`)
    return { ok: true as const }
  }

  const displayBalances = withAllAssets(balances)
  const total = configuration ? totalPortfolioValue(balances, configuration.usdPrices) : 0

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
        {!authReady || loading ? (
          <p className="text-sm" style={{ color: "var(--hw-muted)" }}>
            Loading your wallet…
          </p>
        ) : !userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Please log in to view your wallet.
          </p>
        ) : !configuration ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Price configuration is unavailable. Please refresh and try again.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="hw-page-header" aria-labelledby="wallet-heading">
              <div>
                <p className="hw-eyebrow">Portfolio</p>
                <h1 id="wallet-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Wallet
                </h1>
                <p className="mt-1.5 text-sm" style={{ color: "var(--hw-muted)" }}>
                  View available funds, locked balances, and account activity.
                </p>
              </div>
            </section>
            <PriceStatus configuration={configuration} />

            {/* Hero summary */}
            <div className="hw-card-in hw-card p-5 sm:p-7">
              <p className="hw-eyebrow">
                Total portfolio value
              </p>
              <p
                className="mt-3 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl"
                style={{ color: "var(--hw-text)" }}
              >
                {usdValueFormatter.format(total)}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--hw-muted)" }}>
                Across {displayBalances.filter((b) => b.availableAmount + b.lockedAmount > 0).length} of{" "}
                {displayBalances.length} assets
              </p>
            </div>

            {/* Balance cards */}
            <div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Assets</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>Available and committed balances</p>
                </div>
              </div>
              <div className="hw-card overflow-hidden">
                {displayBalances.map((b) => (
                  <WalletBalanceCard
                    key={b.asset}
                    balance={b}
                    usdPrices={configuration.usdPrices}
                    onDeposit={handleDeposit}
                    onWithdraw={handleWithdraw}
                  />
                ))}
              </div>
            </div>

            <TransactionHistory
              transactions={transactions}
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
