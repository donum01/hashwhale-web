"use client"

import type { ReactNode } from "react"
import { AlertCircle } from "lucide-react"

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
        {label}
      </label>
      <div className="relative">{children}</div>
      {error ? (
        <p
          key={error}
          className="hw-fade-slide flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--hw-error)" }}
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
