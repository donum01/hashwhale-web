"use client"

import { AuthCard } from "@/components/hashwhale/auth-card"
import { useTheme } from "@/components/hashwhale/theme-provider"
import { ThemeToggle } from "@/components/hashwhale/theme-toggle"

export default function Page() {
  const { theme, toggleTheme } = useTheme()

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative flex min-h-svh items-center justify-center px-4 py-10 transition-colors duration-200`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="hidden lg:block" aria-labelledby="auth-introduction">
          <span className="hw-demo-badge inline-flex">Demo environment</span>
          <h1 id="auth-introduction" className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight">
            One account for your digital-asset portfolio.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "var(--hw-muted)" }}>
            Manage balances, compare yield products, and monitor collateral-backed loans through a clear, unified workspace.
          </p>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: "var(--hw-card-border)" }}>
            {[
              ["Wallet", "Track available and locked assets"],
              ["Borrow", "Review LTV and loan health"],
              ["Earn", "Compare terms and rewards"],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="mt-1 text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>{detail}</dd>
              </div>
            ))}
          </dl>
        </section>
        <AuthCard />
      </div>
    </main>
  )
}
