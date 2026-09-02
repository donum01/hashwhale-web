"use client"

import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Use light theme" : "Use dark theme"}
      onClick={onToggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--hw-track)]"
      style={{
        color: "var(--hw-muted)",
        borderColor: "var(--hw-card-border)",
      }}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
