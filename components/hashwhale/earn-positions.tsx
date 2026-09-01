"use client"

import { useMemo, useState } from "react"
import { CalendarClock, Clock3, Loader2, LockKeyhole, PiggyBank, UnlockKeyhole } from "lucide-react"
import {
  assetAmountFormatter,
  earnTermLabel,
  formatEarnDate,
  type EarnPosition,
} from "@/lib/earn"
import { AssetChip } from "./asset-chip"

type WithdrawResult = { ok: true } | { ok: false; message: string }

function termDays(position: EarnPosition): number {
  if (position.termType === "LOCKED_30") return 30
  if (position.termType === "LOCKED_90") return 90
  return 0
}

function positionProgress(position: EarnPosition): number {
  if (position.termType === "FLEXIBLE") return 100
  if (position.status === "WITHDRAWN" || position.daysRemaining === 0) return 100
  const days = termDays(position)
  return Math.max(0, Math.min(100, ((days - (position.daysRemaining ?? days)) / days) * 100))
}

export function EarnPositions({
  positions,
  onWithdraw,
}: {
  positions: EarnPosition[]
  onWithdraw: (positionId: number) => Promise<WithdrawResult>
}) {
  const [tab, setTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE")
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const visiblePositions = useMemo(
    () => positions.filter((position) => (tab === "ACTIVE" ? position.status === "ACTIVE" : position.status !== "ACTIVE")),
    [positions, tab],
  )
  const activeCount = positions.filter((position) => position.status === "ACTIVE").length
  const historyCount = positions.length - activeCount

  async function handleWithdraw(positionId: number) {
    setWithdrawingId(positionId)
    setActionError(null)
    const result = await onWithdraw(positionId)
    if (!result.ok) setActionError(result.message)
    setWithdrawingId(null)
  }

  return (
    <section className="hw-card p-5 sm:p-6" aria-labelledby="earn-positions-heading">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="earn-positions-heading" className="text-xl font-bold" style={{ color: "var(--hw-text)" }}>
            Your positions
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
            Track accrued rewards and maturity progress.
          </p>
        </div>
        <div className="hw-tabs grid grid-cols-2 gap-1 p-1">
          {(["ACTIVE", "HISTORY"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value)
                setActionError(null)
              }}
              className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                background: tab === value ? "var(--hw-indicator)" : "transparent",
                color: tab === value ? "var(--hw-text)" : "var(--hw-muted)",
                boxShadow: tab === value ? "0 2px 8px rgba(13, 83, 255, 0.12)" : "none",
              }}
              aria-pressed={tab === value}
            >
              {value === "ACTIVE" ? `Active (${activeCount})` : `History (${historyCount})`}
            </button>
          ))}
        </div>
      </div>

      {actionError ? (
        <div
          className="hw-fade-slide mb-4 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            color: "var(--hw-error)",
            background: "rgba(255, 100, 13, 0.1)",
            border: "1px solid rgba(255, 100, 13, 0.3)",
          }}
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {visiblePositions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
          >
            <PiggyBank className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>
              {tab === "ACTIVE" ? "No active positions" : "No completed positions"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>
              {tab === "ACTIVE" ? "Choose a product above to put a balance to work." : "Withdrawn positions will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visiblePositions.map((position, index) => {
            const progress = positionProgress(position)
            const flexible = position.termType === "FLEXIBLE"
            const loading = withdrawingId === position.id
            return (
              <article
                key={position.id}
                className="hw-card-in rounded-xl p-5"
                style={{
                  animationDelay: `${index * 55}ms`,
                  background: "var(--hw-input-bg)",
                  border: "1px solid var(--hw-input-border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AssetChip asset={position.asset} size={40} />
                    <div>
                      <p className="font-bold" style={{ color: "var(--hw-text)" }}>
                        {position.asset} · {earnTermLabel(position.termType)}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--hw-muted)" }}>
                        Started {formatEarnDate(position.startDate)} · #{position.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      background: position.status === "ACTIVE" ? "var(--hw-primary-soft)" : "var(--hw-track)",
                      color: position.status === "ACTIVE" ? "var(--hw-primary)" : "var(--hw-muted)",
                    }}
                  >
                    {position.status === "ACTIVE" ? "Earning" : "Withdrawn"}
                  </span>
                </div>

                <div className="my-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs" style={{ color: "var(--hw-muted)" }}>Principal</p>
                    <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
                      {assetAmountFormatter.format(position.principalAmount)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--hw-muted)" }}>{position.asset}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--hw-muted)" }}>APY snapshot</p>
                    <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: "var(--hw-primary)" }}>
                      {position.apy.toFixed(2)}%
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--hw-muted)" }}>at subscription</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--hw-muted)" }}>Rewards</p>
                    <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: "var(--hw-ltv-safe)" }}>
                      +{assetAmountFormatter.format(position.accruedRewards)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--hw-muted)" }}>{position.asset}</p>
                  </div>
                </div>

                {position.status === "ACTIVE" ? (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-1.5" style={{ color: "var(--hw-muted)" }}>
                        {flexible ? <UnlockKeyhole className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                        {flexible ? "Flexible access" : "Maturity progress"}
                      </span>
                      <span className="font-semibold" style={{ color: "var(--hw-text)" }}>
                        {flexible
                          ? "Available now"
                          : position.daysRemaining === 0
                            ? "Matured"
                            : `${position.daysRemaining} days left`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--hw-track)" }}>
                      <div
                        className="hw-earn-progress h-full rounded-full"
                        style={{ width: `${progress}%`, background: "var(--hw-primary)" }}
                      />
                    </div>
                    {!flexible && position.endDate ? (
                      <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--hw-muted)" }}>
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        Matures {formatEarnDate(position.endDate)}
                      </p>
                    ) : null}
                  </div>
                ) : position.endDate ? (
                  <p className="mb-5 flex items-center gap-1 text-xs" style={{ color: "var(--hw-muted)" }}>
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Closed {formatEarnDate(position.endDate)}
                  </p>
                ) : null}

                {position.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => void handleWithdraw(position.id)}
                    disabled={!position.withdrawable || withdrawingId !== null}
                    className="hw-btn-outline flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    title={!position.withdrawable ? "Locked positions can be withdrawn after maturity" : undefined}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Withdrawing…</>
                    ) : position.withdrawable ? (
                      "Withdraw principal + rewards"
                    ) : (
                      "Available at maturity"
                    )}
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
