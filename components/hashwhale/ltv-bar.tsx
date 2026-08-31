import { LTV_DANGER_THRESHOLD, ltvTier, ltvTierColorVar } from "@/lib/borrow"

export function LtvBar({ ltv }: { ltv: number }) {
  const tier = ltvTier(ltv)
  const color = ltvTierColorVar(tier)
  const isDanger = tier === "danger"
  const width = Math.min(Math.max(ltv, 0), 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--hw-muted)" }}>
          Loan-to-Value
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${isDanger ? "hw-warn-pulse" : ""}`}
          style={{ color }}
        >
          {ltv.toFixed(1)}%
        </span>
      </div>

      <div
        className="hw-ltv-track h-2.5 w-full"
        role="progressbar"
        aria-valuenow={Math.round(ltv)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loan-to-value ratio"
      >
        <div
          className={`hw-ltv-fill h-full ${isDanger ? "hw-warn-pulse" : ""}`}
          style={{ width: `${width}%`, background: color }}
        />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--hw-muted)" }}>
        <span>Safe</span>
        <span>Max {LTV_DANGER_THRESHOLD}%</span>
      </div>
    </div>
  )
}
