"use client"

import { CheckCircle2 } from "lucide-react"

export function Toast({ message }: { message: string }) {
  return (
    <div
      className="hw-toast hw-card pointer-events-auto flex items-center gap-3 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--hw-success)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
        {message}
      </p>
    </div>
  )
}
