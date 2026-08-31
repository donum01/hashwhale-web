"use client"

import { useEffect, useRef, useState } from "react"
import { ActiveLoans } from "@/components/hashwhale/active-loans"
import { BorrowForm } from "@/components/hashwhale/borrow-form"
import { ThemeToggle } from "@/components/hashwhale/theme-toggle"
import { Toast } from "@/components/hashwhale/toast"
import { Wordmark } from "@/components/hashwhale/wordmark"
import { apiLoanToLoan, currencyUsd, type Loan, type AssetSymbol } from "@/lib/borrow"
import { api } from "@/lib/api"
import { getUserId } from "@/lib/auth"

export default function BorrowPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userId = getUserId()

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    async function loadLoans() {
      if (!userId) {
        setLoading(false)
        return
      }
      const { data, error } = await api.GET("/api/borrow/{userId}/loans", {
        params: { path: { userId } },
      })
      if (data) {
        setLoans(data.map(apiLoanToLoan))
      }
      if (error) {
        showToast("Could not load your loans")
      }
      setLoading(false)
    }
    loadLoans()
  }, [userId])

  async function handleBorrow(params: {
    asset: AssetSymbol
    collateralAmount: number
    borrowedAmount: number
  }): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!userId) {
      return { ok: false, message: "You must be logged in to borrow." }
    }

    const { data, error } = await api.POST("/api/borrow/{userId}/loans", {
      params: { path: { userId } },
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
      showToast(`Borrowed ${currencyUsd.format(loan.borrowedUsdt)} USDT against ${loan.collateralAmount} ${loan.asset}`)
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
    showToast("Loan repaid and collateral released")
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
          <Wordmark />
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
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
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <BorrowForm onBorrow={handleBorrow} />
            <ActiveLoans loans={loans} onRepay={handleRepay} />
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast} /> : null}
      </div>
    </main>
  )
}