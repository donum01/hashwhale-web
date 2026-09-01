"use client"

import { useEffect, useRef, useState } from "react"
import { ActiveLoans } from "@/components/hashwhale/active-loans"
import { BorrowForm } from "@/components/hashwhale/borrow-form"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { Toast } from "@/components/hashwhale/toast"
import {
  apiBalanceToBalance,
  apiBorrowConfigurationToBorrowConfiguration,
  apiLoanToLoan,
  currencyUsd,
  PRICE_CONFIGURATION_POLL_MS,
  type BorrowConfiguration,
  type CollateralAssetSymbol,
  type Loan,
  type WalletBalance,
} from "@/lib/borrow"
import { api } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { Nav } from "@/components/hashwhale/nav"
import { PriceStatus } from "@/components/hashwhale/price-status"


export default function BorrowPage() {
  const { theme, toggleTheme } = useTheme()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [configuration, setConfiguration] = useState<BorrowConfiguration | null>(null)
  const userId = getUserId()

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
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
    async function loadData() {
      if (!userId) {
        setLoading(false)
        return
      }

      const [loansRes, balancesRes, configurationRes] = await Promise.all([
        api.GET("/api/borrow/loans"),
        api.GET("/api/wallet/balances"),
        api.GET("/api/borrow/configuration", { cache: "no-store" }),
      ])

      if (loansRes.data) setLoans(loansRes.data.map(apiLoanToLoan))
      if (balancesRes.data) setBalances(balancesRes.data.map(apiBalanceToBalance))
      if (configurationRes.data) {
        setConfiguration(apiBorrowConfigurationToBorrowConfiguration(configurationRes.data))
      }

      if (loansRes.error || balancesRes.error || configurationRes.error) {
        showToast("Could not load your account data")
      }
      setLoading(false)
    }
    loadData()
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
      setLoans((prev) => [loan, ...prev])
      const balancesRefreshed = await refreshBalances()
      showToast(
        balancesRefreshed
          ? `Borrowed ${currencyUsd.format(loan.borrowedUsdt)} USDT against ${loan.collateralAmount} ${loan.asset}`
          : "Loan created, but balances could not be refreshed",
      )
    }

    return { ok: true }
  }

  async function handleRepay(id: number) {
    const { error } = await api.POST("/api/borrow/loans/{loanId}/repay", {
      params: { path: { loanId: id } },
    })

    if (error) {
      showToast("Could not repay this loan")
      return
    }

    setLoans((prev) => prev.filter((l) => l.id !== id))
    const balancesRefreshed = await refreshBalances()
    showToast(
      balancesRefreshed
        ? "Loan repaid and collateral released"
        : "Loan repaid, but balances could not be refreshed",
    )
  }

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative min-h-svh overflow-hidden transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div
        className="hw-glow pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <Nav theme={theme} onToggleTheme={toggleTheme} />
        </header>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-balance" style={{ color: "var(--hw-text)" }}>
            Borrow
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
            Unlock liquidity without selling your crypto.
          </p>
        </div>

        {!userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Please log in to view and manage your loans.
          </p>
        ) : loading ? (
          <p className="text-sm" style={{ color: "var(--hw-muted)" }}>
            Loading your loans…
          </p>
        ) : !configuration ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>
            Borrow configuration is unavailable. Please refresh and try again.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <PriceStatus configuration={configuration} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <BorrowForm onBorrow={handleBorrow} balances={balances} configuration={configuration} />
              <ActiveLoans loans={loans} onRepay={handleRepay} configuration={configuration} />
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast} /> : null}
      </div>
    </main>
  )
}