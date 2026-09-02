"use client"

import { useEffect, useRef, useState } from "react"
import { ActiveLoans } from "@/components/hashwhale/active-loans"
import { AppShell } from "@/components/hashwhale/app-shell"
import { BorrowForm } from "@/components/hashwhale/borrow-form"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { Toast, type ToastVariant } from "@/components/hashwhale/toast"
import {
  apiBalanceToBalance,
  apiBorrowConfigurationToBorrowConfiguration,
  apiLoanToLoan,
  PRICE_CONFIGURATION_POLL_MS,
  type BorrowConfiguration,
  type CollateralAssetSymbol,
  type Loan,
  type WalletBalance,
} from "@/lib/borrow"
import { formatAssetAmount } from "@/lib/format"
import { api } from "@/lib/api"
import { HISTORY_BATCH_SIZE, historyPageState, type HistoryPageState } from "@/lib/history"
import { PriceStatus } from "@/components/hashwhale/price-status"
import { useAuthUser } from "@/lib/use-auth-user"

const EMPTY_HISTORY_PAGE: HistoryPageState = { hasMore: false, nextCursor: null }

function appendUniqueLoans(current: Loan[], next: Loan[]): Loan[] {
  const knownIds = new Set(current.map((loan) => loan.id))
  return [...current, ...next.filter((loan) => !knownIds.has(loan.id))]
}

export default function BorrowPage() {
  const { theme, toggleTheme } = useTheme()
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [historyLoans, setHistoryLoans] = useState<Loan[]>([])
  const [activePage, setActivePage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [historyPage, setHistoryPage] = useState<HistoryPageState>(EMPTY_HISTORY_PAGE)
  const [loadingMoreLoans, setLoadingMoreLoans] = useState<"ACTIVE" | "HISTORY" | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [configuration, setConfiguration] = useState<BorrowConfiguration | null>(null)
  const { userId, authReady } = useAuthUser()

  function showToast(message: string, variant: ToastVariant = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, variant })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  async function refreshBalances(): Promise<boolean> {
    if (!userId) return false

    try {
      const { data, error } = await api.GET("/api/wallet/balances")
      if (data) setBalances(data.map(apiBalanceToBalance))
      return !error
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!authReady) return
    async function loadData() {
      if (!userId) {
        setLoading(false)
        return
      }

      const [activeLoansRes, historyLoansRes, balancesRes, configurationRes] = await Promise.all([
        api.GET("/api/borrow/loans", {
          params: { query: { limit: HISTORY_BATCH_SIZE, status: ["ACTIVE"] } },
          cache: "no-store",
        }),
        api.GET("/api/borrow/loans", {
          params: { query: { limit: HISTORY_BATCH_SIZE, status: ["REPAID", "LIQUIDATED"] } },
          cache: "no-store",
        }),
        api.GET("/api/wallet/balances"),
        api.GET("/api/borrow/configuration", { cache: "no-store" }),
      ])

      if (activeLoansRes.data) {
        setActiveLoans(activeLoansRes.data.map(apiLoanToLoan))
        setActivePage(historyPageState(activeLoansRes.response, activeLoansRes.data.length))
      }
      if (historyLoansRes.data) {
        setHistoryLoans(historyLoansRes.data.map(apiLoanToLoan))
        setHistoryPage(historyPageState(historyLoansRes.response, historyLoansRes.data.length))
      }
      if (balancesRes.data) setBalances(balancesRes.data.map(apiBalanceToBalance))
      if (configurationRes.data) {
        setConfiguration(apiBorrowConfigurationToBorrowConfiguration(configurationRes.data))
      }

      if (activeLoansRes.error || historyLoansRes.error || balancesRes.error || configurationRes.error) {
        showToast("Could not load your account data", "error")
      }
      setLoading(false)
    }
    loadData()
  }, [authReady, userId])

  async function loadMoreLoans(kind: "ACTIVE" | "HISTORY") {
    const page = kind === "ACTIVE" ? activePage : historyPage
    if (!page.hasMore || page.nextCursor == null || loadingMoreLoans) return
    setLoadingMoreLoans(kind)
    const statuses = kind === "ACTIVE"
      ? (["ACTIVE"] as const)
      : (["REPAID", "LIQUIDATED"] as const)

    try {
      const response = await api.GET("/api/borrow/loans", {
        params: {
          query: { limit: HISTORY_BATCH_SIZE, beforeId: page.nextCursor, status: [...statuses] },
        },
        cache: "no-store",
      })
      if (response.error || !response.data) {
        showToast("Could not load more loans", "error")
        return
      }
      const nextLoans = response.data.map(apiLoanToLoan)
      if (kind === "ACTIVE") {
        setActiveLoans((current) => appendUniqueLoans(current, nextLoans))
        setActivePage(historyPageState(response.response, response.data.length))
      } else {
        setHistoryLoans((current) => appendUniqueLoans(current, nextLoans))
        setHistoryPage(historyPageState(response.response, response.data.length))
      }
    } catch {
      showToast("Could not reach the Borrow service", "error")
    } finally {
      setLoadingMoreLoans(null)
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

  async function handleBorrow(params: {
    asset: CollateralAssetSymbol
    collateralAmount: number
    borrowedAmount: number
  }): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!userId) {
      return { ok: false, message: "You must be logged in to borrow." }
    }

    const { data, error } = await api.POST("/api/borrow/loans", {
      body: {
        collateralAsset: params.asset,
        collateralAmount: params.collateralAmount,
        borrowedAmount: params.borrowedAmount,
      },
    })

    if (error) {
      const message = (error as { message?: string })?.message ?? "Could not create loan."
      return { ok: false, message }
    }

    if (data) {
      const loan = apiLoanToLoan(data)
      setActiveLoans((current) => [loan, ...current.filter((existing) => existing.id !== loan.id)])
      const balancesRefreshed = await refreshBalances()
      showToast(
        balancesRefreshed
          ? `Borrowed ${formatAssetAmount(loan.borrowedUsdt, "USDT")} against ${formatAssetAmount(loan.collateralAmount, loan.asset)}`
          : "Loan created, but balances could not be refreshed",
        balancesRefreshed ? "success" : "warning",
      )
    }

    return { ok: true }
  }

  async function handleRepay(id: number) {
    const { data, error } = await api.POST("/api/borrow/loans/{loanId}/repay", {
      params: { path: { loanId: id } },
    })

    if (error || !data) {
      showToast("Could not repay this loan", "error")
      return
    }

    const repaidLoan = apiLoanToLoan(data)
    setActiveLoans((current) => current.filter((loan) => loan.id !== id))
    setHistoryLoans((current) => [repaidLoan, ...current.filter((loan) => loan.id !== id)])
    const balancesRefreshed = await refreshBalances()
    showToast(
      balancesRefreshed
        ? "Loan repaid and collateral released"
        : "Loan repaid, but balances could not be refreshed",
      balancesRefreshed ? "success" : "warning",
    )
  }

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
        <section className="hw-page-header mb-6" aria-labelledby="borrow-heading">
          <div>
            <p className="hw-eyebrow">Credit</p>
            <h1 id="borrow-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--hw-text)" }}>
            Borrow
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "var(--hw-muted)" }}>
              Use BTC or ETH as collateral for a USDT loan.
            </p>
          </div>
        </section>

        {!authReady || loading ? (
          <p className="text-sm" style={{ color: "var(--hw-muted)" }}>
            Loading your loans…
          </p>
        ) : !userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Please log in to view and manage your loans.
          </p>
        ) : !configuration ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Borrow configuration is unavailable. Please refresh and try again.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <PriceStatus configuration={configuration} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
              <BorrowForm onBorrow={handleBorrow} balances={balances} configuration={configuration} />
              <ActiveLoans
                activeLoans={activeLoans}
                historyLoans={historyLoans}
                activeHasMore={activePage.hasMore}
                historyHasMore={historyPage.hasMore}
                loadingMore={loadingMoreLoans}
                onLoadMoreActive={() => void loadMoreLoans("ACTIVE")}
                onLoadMoreHistory={() => void loadMoreLoans("HISTORY")}
                onRepay={handleRepay}
                configuration={configuration}
              />
            </div>
          </div>
        )}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
      </div>
    </AppShell>
  )
}
