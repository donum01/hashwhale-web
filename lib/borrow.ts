/* ===========================================================================
   HASHWHALE — BORROW DATA LAYER
   All mock data lives here in one clearly separated block. Each export is
   shaped to mirror a likely API response, so swapping in real endpoints later
   is a matter of replacing these consts with `fetch` calls that return the
   same types.
=========================================================================== */

export type AssetSymbol = "BTC" | "ETH" | "USDT"
export type CollateralAssetSymbol = "BTC" | "ETH"
export type LoanStatus = "ACTIVE" | "REPAID" | "LIQUIDATED"
export type PriceSource = "COINGECKO" | "STATIC" | "STATIC_FALLBACK"
export type AssetPricesUsd = Record<AssetSymbol, number>
export const PRICE_CONFIGURATION_POLL_MS = 15_000

export interface AssetConfig {
  symbol: AssetSymbol
  name: string
  color: string
}

export interface BorrowConfiguration {
  usdPrices: AssetPricesUsd
  priceSource: PriceSource
  pricesUpdatedAt: string | null
  pricesStale: boolean
  interestRateApr: number
  maxLtvPercent: number
  warningLtvPercent: number
  liquidationLtvPercent: number
}

export interface Loan {
  id: number
  asset: AssetSymbol
  collateralAmount: number
  borrowedUsdt: number
  interestRateApr: number
  status: LoanStatus
  createdAt: string
}

/* --- Collateral assets ---------------------------------------------------- */

export const ASSETS: Record<AssetSymbol, AssetConfig> = {
  BTC: { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  ETH: { symbol: "ETH", name: "Ethereum", color: "#627eea" },
  USDT: { symbol: "USDT", name: "Tether", color: "#26a17b" },
}

export const ASSET_LIST: AssetConfig[] = [ASSETS.BTC, ASSETS.ETH, ASSETS.USDT]
export const COLLATERAL_ASSET_LIST: AssetConfig[] = [ASSETS.BTC, ASSETS.ETH]

/* --- Derived helpers ------------------------------------------------------ */

export type LtvTier = "safe" | "warn" | "danger"

export function collateralValueUsd(asset: AssetSymbol, amount: number, prices: AssetPricesUsd): number {
  return amount * prices[asset]
}

/** LTV as a percentage (0–100+). Returns 0 when there's no collateral value. */
export function computeLtv(collateralValue: number, borrowedUsdt: number): number {
  if (collateralValue <= 0) return 0
  return (borrowedUsdt / collateralValue) * 100
}

export function loanLtv(loan: Loan, configuration: BorrowConfiguration): number {
  const borrowedValueUsd = loan.borrowedUsdt * configuration.usdPrices.USDT
  return computeLtv(
    collateralValueUsd(loan.asset, loan.collateralAmount, configuration.usdPrices),
    borrowedValueUsd,
  )
}

/** Price of the collateral asset at which this position gets liquidated. */
export function liquidationPrice(loan: Loan, configuration: BorrowConfiguration): number {
  if (loan.collateralAmount <= 0) return 0
  const borrowedValueUsd = loan.borrowedUsdt * configuration.usdPrices.USDT
  return borrowedValueUsd / (loan.collateralAmount * (configuration.liquidationLtvPercent / 100))
}

export function ltvTier(ltv: number, configuration: BorrowConfiguration): LtvTier {
  if (ltv > configuration.maxLtvPercent) return "danger"
  if (ltv >= configuration.warningLtvPercent) return "warn"
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

export const loanDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

import type { components } from "./api-schema"

type ApiLoan = components["schemas"]["LoanResponse"]
type ApiWalletBalance = components["schemas"]["WalletBalanceResponse"]
type ApiBorrowConfiguration = components["schemas"]["BorrowConfigurationResponse"]


export function apiLoanToLoan(apiLoan: ApiLoan): Loan {
  return {
    id: apiLoan.id!,
    asset: apiLoan.collateralAsset as AssetSymbol,
    collateralAmount: Number(apiLoan.collateralAmount),
    borrowedUsdt: Number(apiLoan.borrowedAmount),
    interestRateApr: Number(apiLoan.interestRateApr),
    status: apiLoan.status as LoanStatus,
    createdAt: apiLoan.createdAt!,
  }
}

export function apiBorrowConfigurationToBorrowConfiguration(
  apiConfiguration: ApiBorrowConfiguration,
): BorrowConfiguration {
  const prices = apiConfiguration.usdPrices ?? {}
  return {
    usdPrices: {
      BTC: Number(prices.BTC),
      ETH: Number(prices.ETH),
      USDT: Number(prices.USDT),
    },
    priceSource: (apiConfiguration.priceSource ?? "STATIC_FALLBACK") as PriceSource,
    pricesUpdatedAt: apiConfiguration.pricesUpdatedAt ?? null,
    pricesStale: apiConfiguration.pricesStale ?? true,
    interestRateApr: Number(apiConfiguration.interestRateApr),
    maxLtvPercent: Number(apiConfiguration.maxLtvPercent),
    warningLtvPercent: Number(apiConfiguration.warningLtvPercent),
    liquidationLtvPercent: Number(apiConfiguration.liquidationLtvPercent),
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
