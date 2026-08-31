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
  price: number
  color: string
}

export interface Loan {
  id: number
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
  BTC: { symbol: "BTC", name: "Bitcoin", price: 64000, color: "#f7931a" },
  ETH: { symbol: "ETH", name: "Ethereum", price: 3400, color: "#627eea" },
  USDT: { symbol: "USDT", name: "Tether", price: 1, color: "#26a17b" },
}

export const ASSET_LIST: AssetConfig[] = [ASSETS.BTC, ASSETS.ETH, ASSETS.USDT]

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

import type { components } from "./api-schema"

type ApiLoan = components["schemas"]["LoanResponse"]
type ApiWalletBalance = components["schemas"]["WalletBalanceResponse"]


export function apiLoanToLoan(apiLoan: ApiLoan): Loan {
  return {
    id: apiLoan.id!,
    asset: apiLoan.collateralAsset as AssetSymbol,
    collateralAmount: Number(apiLoan.collateralAmount),
    borrowedUsdt: Number(apiLoan.borrowedAmount),
  }
}

export interface WalletBalance {
  asset: AssetSymbol
  availableAmount: number
  lockedAmount: number
}

export function apiBalanceToBalance(apiBalance: ApiWalletBalance): WalletBalance {
  return {
    asset: apiBalance.asset as AssetSymbol,
    availableAmount: Number(apiBalance.availableAmount),
    lockedAmount: Number(apiBalance.lockedAmount),
  }
}