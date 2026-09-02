"use client"

import type { ReactNode } from "react"
import type { Theme } from "./theme-provider"
import { Nav } from "./nav"

export function AppShell({
  theme,
  onToggleTheme,
  children,
}: {
  theme: Theme
  onToggleTheme: () => void
  children: ReactNode
}) {
  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} min-h-svh transition-colors duration-200`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      <div className="hw-page-shell">
        <header className="sticky top-3 z-40 mb-8 sm:mb-10">
          <Nav theme={theme} onToggleTheme={onToggleTheme} />
        </header>
        {children}
      </div>
    </main>
  )
}
