"use client"

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

export type ToastVariant = "success" | "warning" | "error"

export function Toast({ message, variant = "success" }: { message: string; variant?: ToastVariant }) {
  const Icon = variant === "error" ? XCircle : variant === "warning" ? AlertTriangle : CheckCircle2
  const color = variant === "error"
    ? "var(--hw-error)"
    : variant === "warning"
      ? "var(--hw-ltv-warn)"
      : "var(--hw-success)"

  return (
    <div
      className="hw-toast hw-card pointer-events-auto flex items-center gap-3 px-4 py-3"
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} aria-hidden="true" />
      <p className="text-sm font-medium" style={{ color: "var(--hw-text)" }}>
        {message}
      </p>
    </div>
  )
}
