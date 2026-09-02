"use client"

import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, History, Loader2, Repeat } from "lucide-react"
import { formatAssetAmount } from "@/lib/format"
import { dateFormatter, TRANSACTION_LABELS, type WalletTransaction } from "@/lib/wallet"
import { AssetChip } from "./asset-chip"

function TxIcon({ type }: { type: WalletTransaction["type"] }) {
  if (type === "DEPOSIT" || type === "EARN_WITHDRAW") return <ArrowDownToLine className="h-4 w-4" />
  if (type === "WITHDRAW" || type === "BORROW") return <ArrowUpFromLine className="h-4 w-4" />
  return <Repeat className="h-4 w-4" />
}

function statusColor(status: WalletTransaction["status"]): string {
  if (status === "COMPLETED") return "var(--hw-ltv-safe)"
  if (status === "PENDING") return "var(--hw-ltv-warn)"
  return "var(--hw-error)"
}

export function TransactionHistory({
  transactions,
  title = "Recent activity",
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: {
  transactions: WalletTransaction[]
  title?: string
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  return (
    <section className="hw-card overflow-hidden">
      <div className="hw-panel-header">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--hw-text)" }}>{title}</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--hw-muted)" }}>
            {transactions.length > 0 ? `Showing ${transactions.length} · newest first` : "Newest transactions first"}
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--hw-primary-soft)", color: "var(--hw-primary)" }}
          >
            <History className="h-6 w-6" />
          </span>
          <p className="text-sm" style={{ color: "var(--hw-muted)" }}>
            No activity yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {transactions.map((tx, i) => (
            <div
              key={`${tx.createdAt}-${tx.type}-${tx.asset}-${tx.amount}-${i}`}
              className="hw-data-row flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "var(--hw-track)", color: "var(--hw-muted)" }}
                >
                  <TxIcon type={tx.type} />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>
                    {TRANSACTION_LABELS[tx.type]}
                  </p>
                  <p className="text-xs" style={{ color: "var(--hw-muted)" }}>
                    {dateFormatter.format(new Date(tx.createdAt))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: "var(--hw-text)" }}>
                    {formatAssetAmount(tx.amount, tx.asset)}
                  </p>
                  <p
                    className="text-xs font-medium capitalize"
                    style={{ color: statusColor(tx.status) }}
                  >
                    {tx.status.toLowerCase()}
                  </p>
                </div>
                <AssetChip asset={tx.asset} size={28} />
              </div>
            </div>
          ))}
          {hasMore && onLoadMore ? (
            <div className="flex justify-center border-t px-5 py-4" style={{ borderColor: "var(--hw-card-border)" }}>
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="hw-btn-outline flex h-9 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Loading</>
                ) : (
                  <>Load 10 more <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
