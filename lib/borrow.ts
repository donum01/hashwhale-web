/* ===========================================================================
   HASHWHALE — BORROW DATA LAYER
   All mock data lives here in one clearly separated block. Each export is
   shaped to mirror a likely API response, so swapping in real endpoints later
   is a matter of replacing these consts with `fetch` calls that return the
   same types.
=========================================================================== */

export type AssetSymbol = "BTC" | "ETH" | "USDT"

export interface AssetConfig {
  symbol: AssetSymbol
  name: string
  /** Mock spot price in USD — replace with a live price feed. */
  price: number
  /** Mock available wallet balance for the "Max" button. */
  maxBalance: number
  /** Brand color for the asset chip. */
  color: string
}

export interface Loan {
  id: string
  asset: AssetSymbol
  collateralAmount: number
  borrowedUsdt: number
}

/* --- Static protocol parameters ------------------------------------------ */

/** HashWhale's real minimum loan rate. */
export const INTEREST_RATE_APR = 2.88

/** Max LTV a new loan may be opened at. */
export const MAX_LTV = 70

/** LTV at which a position is liquidated (used for liquidation price). */
export const LIQUIDATION_LTV = 85

/** LTV tier thresholds. */
export const LTV_WARN_THRESHOLD = 50
export const LTV_DANGER_THRESHOLD = 70

/* --- Collateral assets ---------------------------------------------------- */

export const ASSETS: Record<AssetSymbol, AssetConfig> = {
  BTC: { symbol: "BTC", name: "Bitcoin", price: 64000, maxBalance: 1.5, color: "#f7931a" },
  ETH: { symbol: "ETH", name: "Ethereum", price: 3400, maxBalance: 12, color: "#627eea" },
  USDT: { symbol: "USDT", name: "Tether", price: 1, maxBalance: 25000, color: "#26a17b" },
}

export const ASSET_LIST: AssetConfig[] = [ASSETS.BTC, ASSETS.ETH, ASSETS.USDT]

/* --- Mock active loans (one per LTV tier for demo) ------------------------ */

export const MOCK_LOANS: Loan[] = [
  // ~35% LTV → green / safe
  { id: "ln_001", asset: "BTC", collateralAmount: 1, borrowedUsdt: 22400 },
  // ~58% LTV → amber / warning
  { id: "ln_002", asset: "ETH", collateralAmount: 5, borrowedUsdt: 9860 },
  // ~72% LTV → orange / danger
  { id: "ln_003", asset: "BTC", collateralAmount: 0.5, borrowedUsdt: 23040 },
]

/* --- Derived helpers ------------------------------------------------------ */

export type LtvTier = "safe" | "warn" | "danger"

export function collateralValueUsd(asset: AssetSymbol, amount: number): number {
  return amount * ASSETS[asset].price
}

/** LTV as a percentage (0–100+). Returns 0 when there's no collateral value. */
export function computeLtv(collateralValue: number, borrowedUsdt: number): number {
  if (collateralValue <= 0) return 0
  return (borrowedUsdt / collateralValue) * 100
}

export function loanLtv(loan: Loan): number {
  return computeLtv(collateralValueUsd(loan.asset, loan.collateralAmount), loan.borrowedUsdt)
}

/** Price of the collateral asset at which this position gets liquidated. */
export function liquidationPrice(loan: Loan): number {
  if (loan.collateralAmount <= 0) return 0
  return loan.borrowedUsdt / (loan.collateralAmount * (LIQUIDATION_LTV / 100))
}

export function ltvTier(ltv: number): LtvTier {
  if (ltv > LTV_DANGER_THRESHOLD) return "danger"
  if (ltv >= LTV_WARN_THRESHOLD) return "warn"
  return "safe"
}

/** CSS variable for a given tier, resolves per active light/dark theme. */
export function ltvTierColorVar(tier: LtvTier): string {
  return tier === "danger" ? "var(--hw-ltv-danger)" : tier === "warn" ? "var(--hw-ltv-warn)" : "var(--hw-ltv-safe)"
}

export const currencyUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const currencyUsdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})
