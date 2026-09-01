"use client"

import { ArrowDownToLine, ArrowUpFromLine, History, Repeat } from "lucide-react"
import { currencyUsdPrecise } from "@/lib/borrow"
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
  title = "Recent Activity",
}: {
  transactions: WalletTransaction[]
  title?: string
}) {
  return (
    <div className="hw-card p-5">
      <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--hw-text)" }}>
        {title}
      </h2>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
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
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--hw-input-border)" }}>
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
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
                    {tx.amount} {tx.asset}
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
        </div>
      )}
    </div>
  )
}
