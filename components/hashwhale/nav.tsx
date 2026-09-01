"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
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
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const railRef = useRef<HTMLDivElement>(null)

  function measureIndicator() {
    const activeEl = linkRefs.current[pathname]
    const railEl = railRef.current
    if (!activeEl || !railEl) {
      setIndicator((s) => ({ ...s, ready: false }))
      return
    }
    const railRect = railEl.getBoundingClientRect()
    const linkRect = activeEl.getBoundingClientRect()
    setIndicator({
      left: linkRect.left - railRect.left,
      width: linkRect.width,
      ready: true,
    })
  }

  useEffect(() => {
    measureIndicator()
    window.addEventListener("resize", measureIndicator)
    return () => window.removeEventListener("resize", measureIndicator)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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
      className="hw-nav relative z-40 w-full min-w-0 py-3 backdrop-blur-xl transition-colors duration-300"
      style={{
        background: "var(--hw-nav-bg)",
        borderBottom: "1px solid var(--hw-input-border)",
      }}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-6">
          <div className="shrink-0">
            <Wordmark />
          </div>

          {/* Desktop nav rail */}
          <div ref={railRef} className="relative hidden shrink-0 items-center gap-1 md:flex">
            {indicator.ready ? (
              <span
                className="absolute inset-y-1 rounded-lg transition-all duration-300 ease-out"
                style={{
                  left: indicator.left,
                  width: indicator.width,
                  background: "var(--hw-primary-soft)",
                }}
                aria-hidden="true"
              />
            ) : null}
            {LINKS.map((link) => {
              const active = isActivePath(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    linkRefs.current[link.href] = el
                  }}
                  aria-current={active ? "page" : undefined}
                  className="relative z-10 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200"
                  style={{ color: active ? "var(--hw-primary)" : "var(--hw-muted)" }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            type="button"
            onClick={logout}
            className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 md:flex"
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
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:hidden"
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
        className="overflow-hidden transition-all duration-300 ease-out md:hidden"
        style={{
          maxHeight: mobileOpen ? "280px" : "0px",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        <div className="flex w-full flex-col gap-1 pt-3">
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
