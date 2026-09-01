"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Check, ChevronRight, RefreshCw } from "lucide-react"
import { type AssetSymbol } from "@/lib/borrow"
import { assetAmountFormatter, earnTermLabel, type EarnProduct } from "@/lib/earn"
import { AssetChip } from "./asset-chip"

type ProductFilter = "ALL" | AssetSymbol
const FILTERS: ProductFilter[] = ["ALL", "BTC", "ETH", "USDT"]

export function EarnProductCatalog({
  products,
  selectedProductId,
  onSelect,
}: {
  products: EarnProduct[]
  selectedProductId: string | null
  onSelect: (productId: string) => void
}) {
  const [filter, setFilter] = useState<ProductFilter>("ALL")
  const visibleProducts = useMemo(
    () => products.filter((product) => product.active && (filter === "ALL" || product.asset === filter)),
    [filter, products],
  )

  return (
    <section aria-labelledby="earn-products-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="earn-products-heading" className="text-xl font-bold" style={{ color: "var(--hw-text)" }}>
            Choose a product
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
            Flexible access or a higher fixed-term rate.
          </p>
        </div>

        <div className="hw-tabs grid grid-cols-4 gap-1 p-1" aria-label="Filter products by asset">
          {FILTERS.map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => setFilter(asset)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: filter === asset ? "var(--hw-indicator)" : "transparent",
                color: filter === asset ? "var(--hw-text)" : "var(--hw-muted)",
                boxShadow: filter === asset ? "0 2px 8px rgba(13, 83, 255, 0.12)" : "none",
              }}
              aria-pressed={filter === asset}
            >
              {asset === "ALL" ? "All" : asset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product, index) => {
          const selected = product.id === selectedProductId
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className="hw-card-in hw-card-hover hw-card relative overflow-hidden p-5 text-left"
              style={{
                animationDelay: `${index * 45}ms`,
                borderColor: selected ? "var(--hw-primary)" : undefined,
                boxShadow: selected ? "0 0 0 1px var(--hw-primary-soft)" : undefined,
              }}
              aria-pressed={selected}
            >
              {selected ? (
                <span
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "var(--hw-primary)", color: "white" }}
                  aria-label="Selected"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}

              <div className="flex items-center gap-3">
                <AssetChip asset={product.asset} size={38} />
                <div>
                  <p className="font-bold" style={{ color: "var(--hw-text)" }}>
                    {product.asset} Earn
                  </p>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--hw-muted)" }}>
                    {product.flexible ? (
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    )}
                    {earnTermLabel(product.termType)}
                  </span>
                </div>
              </div>

              <div
                className="hw-earn-apy my-5 rounded-xl px-4 py-3"
                style={{ background: "var(--hw-primary-soft)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--hw-muted)" }}>
                  Annual percentage yield
                </p>
                <p className="mt-0.5 text-3xl font-bold tabular-nums" style={{ color: "var(--hw-primary)" }}>
                  {product.apy.toFixed(2)}%
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--hw-muted)" }}>Minimum</span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--hw-text)" }}>
                  {assetAmountFormatter.format(product.minimumAmount)} {product.asset}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-end gap-1 text-xs font-bold" style={{ color: "var(--hw-primary)" }}>
                Select <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
