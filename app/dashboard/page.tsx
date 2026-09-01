"use client"

import { useCallback, useEffect, useState } from "react"
import { CloudOff, Radio, RefreshCw, Sparkles } from "lucide-react"
import { ActionCenter, CapitalAllocation, ProductHealth, RecommendedAction } from "@/components/hashwhale/dashboard-insights"
import { DashboardOverview } from "@/components/hashwhale/dashboard-overview"
import { MarketPriceChart } from "@/components/hashwhale/market-price-chart"
import { Nav } from "@/components/hashwhale/nav"
import { TransactionHistory } from "@/components/hashwhale/transaction-history"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { api } from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { accountName, apiDashboardToDashboard, type DashboardSummary } from "@/lib/dashboard"

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
})

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userId = getUserId()

  const loadSummary = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    try {
      const { data, error: apiError } = await api.GET("/api/dashboard/summary", { cache: "no-store" })
      if (apiError || !data) {
        setError((apiError as { message?: string } | undefined)?.message ?? "Could not load your dashboard.")
        return
      }
      setSummary(apiDashboardToDashboard(data))
      setError(null)
    } catch {
      setError("Could not reach the dashboard service.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    void loadSummary()
    const interval = window.setInterval(() => void loadSummary(true), 30_000)
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void loadSummary(true)
    }
    window.addEventListener("focus", refreshVisible)
    document.addEventListener("visibilitychange", refreshVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshVisible)
      document.removeEventListener("visibilitychange", refreshVisible)
    }
  }, [loadSummary, userId])

  const livePrices = summary?.priceSource === "COINGECKO" && !summary.pricesStale

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative min-h-svh overflow-hidden transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div className="hw-glow pointer-events-none absolute left-1/2 top-0 h-[620px] w-[620px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8">
          <Nav theme={theme} onToggleTheme={toggleTheme} />
        </header>

        {!userId ? (
          <p className="text-sm" style={{ color: "var(--hw-error)" }}>Please log in to access your dashboard.</p>
        ) : loading ? (
          <div className="space-y-5 py-8" aria-label="Loading dashboard">
            <div className="h-10 w-72 animate-pulse rounded-lg" style={{ background: "var(--hw-track)" }} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl" style={{ background: "var(--hw-track)" }} />)}
            </div>
            <div className="h-96 animate-pulse rounded-xl" style={{ background: "var(--hw-track)" }} />
          </div>
        ) : !summary ? (
          <div className="hw-card max-w-lg p-6">
            <p className="text-sm font-semibold" style={{ color: "var(--hw-error)" }}>{error ?? "Dashboard data is unavailable."}</p>
            <button type="button" onClick={() => void loadSummary()} className="hw-btn-outline mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <section className="hw-card-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-labelledby="dashboard-heading">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--hw-primary)" }}>
                  <Sparkles className="h-4 w-4" /> Your financial command centre
                </div>
                <h1 id="dashboard-heading" className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--hw-text)" }}>
                  Welcome back, {accountName(summary.email)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--hw-muted)" }}>
                  See what needs attention and how your simulated capital is working across HashWhale.
                </p>
              </div>
              <div className="flex flex-col items-start gap-1.5 text-xs sm:items-end">
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: livePrices ? "var(--hw-ltv-safe)" : "var(--hw-ltv-warn)" }}>
                  {livePrices ? <Radio className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
                  {livePrices ? "Live portfolio pricing" : "Fallback portfolio pricing"}
                  {refreshing ? <RefreshCw className="ml-1 h-3 w-3 animate-spin" /> : null}
                </span>
                <span style={{ color: "var(--hw-muted)" }}>
                  {summary.pricesUpdatedAt ? `As of ${updatedAtFormatter.format(new Date(summary.pricesUpdatedAt))}` : "Waiting for a live provider update"}
                </span>
              </div>
            </section>

            {error ? (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--hw-ltv-warn)", background: "var(--hw-track)" }} role="status">
                {error} Displaying the last dashboard snapshot.
              </p>
            ) : null}

            <DashboardOverview summary={summary} />
            <MarketPriceChart />

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <ActionCenter summary={summary} />
              <CapitalAllocation summary={summary} />
            </div>

            <ProductHealth summary={summary} />
            <RecommendedAction summary={summary} />
            <TransactionHistory transactions={summary.recentTransactions} title="Latest activity" />

            <p className="pb-2 text-center text-[11px] leading-relaxed" style={{ color: "var(--hw-muted)" }}>
              Dashboard figures and prompts are for this simulated environment only and are not financial advice.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
