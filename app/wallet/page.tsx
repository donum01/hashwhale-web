"use client"

import { useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { Toast } from "@/components/hashwhale/toast"
import { TransactionHistory } from "@/components/hashwhale/transaction-history"
import { WalletBalanceCard } from "@/components/hashwhale/wallet-balance-card"
import {
  apiBorrowConfigurationToBorrowConfiguration,
  currencyUsd,
  PRICE_CONFIGURATION_POLL_MS,
  type AssetSymbol,
  type BorrowConfiguration,
} from "@/lib/borrow"
import {
  apiBalanceToBalance,
  apiTransactionToTransaction,
  totalPortfolioValue,
  withAllAssets,
  type WalletBalance,
  type WalletTransaction,
} from "@/lib/wallet"
import { api } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Nav } from "@/components/hashwhale/nav"
import { PriceStatus } from "@/components/hashwhale/price-status"

export default function WalletPage() {
  const { theme, toggleTheme } = useTheme()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [configuration, setConfiguration] = useState<BorrowConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
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
    const [balancesRes, txRes, configurationRes] = await Promise.all([
      api.GET("/api/wallet/{userId}/balances", { params: { path: { userId } } }),
      api.GET("/api/wallet/{userId}/transactions", { params: { path: { userId } } }),
      api.GET("/api/borrow/configuration", { cache: "no-store" }),
    ])
    if (balancesRes.data) setBalances(balancesRes.data.map(apiBalanceToBalance))
    if (txRes.data) setTransactions(txRes.data.map(apiTransactionToTransaction))
    if (configurationRes.data) {
      setConfiguration(apiBorrowConfigurationToBorrowConfiguration(configurationRes.data))
    }
    if (balancesRes.error || txRes.error || configurationRes.error) showToast("Could not load wallet data")
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!userId) return

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
  }, [userId])

  async function handleDeposit(asset: AssetSymbol, amount: number) {
    if (!userId) return { ok: false as const, message: "You must be logged in." }
    const { error } = await api.POST("/api/wallet/{userId}/deposit", {
      params: { path: { userId } },
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
    const { error } = await api.POST("/api/wallet/{userId}/withdraw", {
      params: { path: { userId } },
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
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative min-h-svh overflow-hidden transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div className="hw-glow pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <Nav theme={theme} onToggleTheme={toggleTheme} />
        </header>

        {!userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Please log in to view your wallet.
          </p>
        ) : loading ? (
          <p className="text-sm" style={{ color: "var(--hw-muted)" }}>
            Loading your wallet…
          </p>
        ) : !configuration ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Price configuration is unavailable. Please refresh and try again.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <PriceStatus configuration={configuration} />
            <div
              className="hw-card flex items-start gap-3 p-4"
              style={{ borderColor: "var(--hw-primary)", background: "var(--hw-primary-soft)" }}
              role="note"
              aria-label="Wallet simulation notice"
            >
              <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--hw-primary)" }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--hw-text)" }}>
                  Simulation mode
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
                  Deposits and withdrawals only update this demo&apos;s internal ledger. No blockchain
                  transaction occurs and no real assets or money are moved.
                </p>
              </div>
            </div>

            {/* Hero summary */}
            <div className="hw-card-in hw-card p-6 sm:p-8">
              <p className="text-sm font-medium" style={{ color: "var(--hw-muted)" }}>
                Total Portfolio Value
              </p>
              <p
                className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
                style={{ color: "var(--hw-text)" }}
              >
                {currencyUsd.format(total)}
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--hw-muted)" }}>
                Across {displayBalances.filter((b) => b.availableAmount + b.lockedAmount > 0).length} of{" "}
                {displayBalances.length} assets
              </p>
            </div>

            {/* Balance cards */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--hw-muted)" }}>
                Assets
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            <TransactionHistory transactions={transactions} />
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast} /> : null}
      </div>
    </main>
  )
}
