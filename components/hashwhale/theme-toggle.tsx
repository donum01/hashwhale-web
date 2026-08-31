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
      aria-label="Toggle dark mode"
      onClick={onToggle}
      className="relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300"
      style={{
        background: "var(--hw-track)",
        border: "1px solid var(--hw-input-border)",
      }}
    >
      {/* sliding knob */}
      <span
        className="absolute flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 ease-out"
        style={{
          background: "var(--hw-indicator)",
          boxShadow: "0 2px 8px rgba(13, 83, 255, 0.2)",
          transform: isDark ? "translateX(28px)" : "translateX(0)",
        }}
      >
        <Sun
          className="absolute h-4 w-4 transition-all duration-300"
          style={{
            color: "var(--hw-accent)",
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1)",
          }}
        />
        <Moon
          className="absolute h-4 w-4 transition-all duration-300"
          style={{
            color: "var(--hw-primary)",
            opacity: isDark ? 1 : 0,
            transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.5)",
          }}
        />
      </span>
    </button>
  )
}
