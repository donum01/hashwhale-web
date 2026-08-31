"use client"

import { useRef, useState } from "react"
import { ActiveLoans } from "@/components/hashwhale/active-loans"
import { BorrowForm } from "@/components/hashwhale/borrow-form"
import { ThemeToggle } from "@/components/hashwhale/theme-toggle"
import { Toast } from "@/components/hashwhale/toast"
import { Wordmark } from "@/components/hashwhale/wordmark"
import { MOCK_LOANS, currencyUsd, type Loan } from "@/lib/borrow"

export default function BorrowPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [loans, setLoans] = useState<Loan[]>(MOCK_LOANS)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  function handleBorrow(loan: Loan) {
    setLoans((prev) => [loan, ...prev])
    showToast(`Borrowed ${currencyUsd.format(loan.borrowedUsdt)} USDT against ${loan.collateralAmount} ${loan.asset}`)
  }

  function handleRepay(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id))
    showToast("Loan repaid and collateral released")
  }

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative min-h-svh overflow-hidden transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      {/* Ambient glow */}
      <div
        className="hw-glow pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
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

        {/* Two columns → single column on mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <BorrowForm onBorrow={handleBorrow} />
          <ActiveLoans loans={loans} onRepay={handleRepay} />
        </div>
      </div>

      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast ? <Toast message={toast} /> : null}
      </div>
    </main>
  )
}
