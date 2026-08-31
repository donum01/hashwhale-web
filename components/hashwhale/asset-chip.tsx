import { ASSETS, type AssetSymbol } from "@/lib/borrow"

export function AssetChip({ asset, size = 32 }: { asset: AssetSymbol; size?: number }) {
  const config = ASSETS[asset]
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: config.color,
        fontSize: size * 0.34,
        boxShadow: `0 2px 8px ${config.color}55`,
      }}
      aria-hidden="true"
    >
      {asset}
    </span>
  )
}
