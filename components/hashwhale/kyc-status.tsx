"use client"

import { CheckCircle2, Clock, CircleDashed } from "lucide-react"

export type KycState = "not_started" | "pending" | "verified"

const CONFIG: Record<
  KycState,
  {
    label: string
    icon: typeof CheckCircle2
    fg: string
    bg: string
    border: string
  }
> = {
  not_started: {
    label: "Not Started",
    icon: CircleDashed,
    fg: "var(--hw-muted)",
    bg: "var(--hw-track)",
    border: "var(--hw-input-border)",
  },
  pending: {
    label: "Pending Review",
    icon: Clock,
    fg: "#d98a00",
    bg: "rgba(217, 138, 0, 0.12)",
    border: "rgba(217, 138, 0, 0.3)",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    fg: "var(--hw-success)",
    bg: "rgba(16, 217, 160, 0.12)",
    border: "rgba(16, 217, 160, 0.3)",
  },
}

/**
 * KYC status component. Hidden by default — pass `show` to reveal it once you
 * wire up the real verification state later.
 */
export function KycStatus({
  state,
  show = false,
}: {
  state: KycState
  show?: boolean
}) {
  if (!show) return null

  const { label, icon: Icon, fg, bg, border } = CONFIG[state]

  return (
    <div className="hw-fade-slide mt-5 flex items-center justify-between rounded-lg px-3 py-2.5">
      <span className="text-xs font-medium" style={{ color: "var(--hw-muted)" }}>
        Identity verification (KYC)
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{ color: fg, background: bg, border: `1px solid ${border}` }}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    </div>
  )
}
