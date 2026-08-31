"use client"

import { useState } from "react"
import { AuthCard } from "@/components/hashwhale/auth-card"
import { ThemeToggle } from "@/components/hashwhale/theme-toggle"

export default function Page() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  return (
    <main
      className={`hw ${theme === "dark" ? "hw-dark" : "hw-light"} relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10 transition-colors duration-300`}
      style={{ background: "var(--hw-bg)", color: "var(--hw-text)" }}
    >
      {/* Pulsing radial glow behind the card */}
      <div
        className="hw-glow pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px]"
        aria-hidden="true"
      />

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "light" ? "dark" : "light"))} />
      </div>

      <AuthCard />
    </main>
  )
}
