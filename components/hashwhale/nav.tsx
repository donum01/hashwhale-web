"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CircleDot, LogOut, Menu, X } from "lucide-react"
import { Wordmark } from "./wordmark"
import { ThemeToggle } from "./theme-toggle"
import { clearAuth } from "@/lib/auth"

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/borrow", label: "Borrow" },
  { href: "/earn", label: "Earn" },
]

export function Nav({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark"
  onToggleTheme: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  function logout() {
    clearAuth()
    router.push("/")
  }

  function isActivePath(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="hw-nav w-full min-w-0 rounded-xl border px-3 py-2 shadow-sm backdrop-blur-xl transition-colors duration-200 sm:px-4"
      style={{
        background: "var(--hw-nav-bg)",
        borderColor: "var(--hw-card-border)",
      }}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-6">
          <div className="shrink-0">
            <Wordmark />
          </div>

          {/* Desktop nav rail */}
          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const active = isActivePath(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150"
                  style={{
                    color: active ? "var(--hw-primary)" : "var(--hw-muted)",
                    background: active ? "var(--hw-primary-soft)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hw-demo-badge hidden sm:inline-flex">
            <CircleDot className="h-3 w-3" aria-hidden="true" /> Demo
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            type="button"
            onClick={logout}
            className="hidden h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 hover:bg-[var(--hw-track)] lg:flex"
            style={{ color: "var(--hw-muted)" }}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors lg:hidden"
            style={{ color: "var(--hw-muted)" }}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        id="mobile-navigation"
        aria-hidden={!mobileOpen}
        className="overflow-hidden transition-all duration-300 ease-out lg:hidden"
        style={{
          maxHeight: mobileOpen ? "280px" : "0px",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        <div className="flex w-full flex-col gap-1 pt-3">
          <div className="mb-1 flex items-center justify-between px-3 py-2 sm:hidden">
            <span className="text-xs font-semibold" style={{ color: "var(--hw-muted)" }}>Environment</span>
            <span className="hw-demo-badge inline-flex"><CircleDot className="h-3 w-3" /> Demo</span>
          </div>
          {LINKS.map((link) => {
            const active = isActivePath(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                tabIndex={mobileOpen ? 0 : -1}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-200"
                style={{
                  color: active ? "var(--hw-primary)" : "var(--hw-muted)",
                  background: active ? "var(--hw-primary-soft)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={logout}
            tabIndex={mobileOpen ? 0 : -1}
            className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200"
            style={{ color: "var(--hw-error)" }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
