import type { components } from "./api-schema"
import type { AssetSymbol, PriceSource } from "./borrow"
import { apiTransactionToTransaction, type WalletTransaction } from "./wallet"

type ApiDashboardSummary = components["schemas"]["DashboardSummaryResponse"]
type ApiMarketHistory = components["schemas"]["MarketPriceHistoryResponse"]

export type FiatCurrency = "USD" | "GBP" | "CAD" | "EUR" | "SGD" | "JPY" | "AUD" | "AED" | "CHF" | "PHP"
export type MarketRange = "1D" | "7D" | "30D" | "90D"
export type BorrowHealth = "NONE" | "HEALTHY" | "WARNING" | "AT_RISK"
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL"

export interface DashboardAlert {
  severity: AlertSeverity
  title: string
  message: string
  href: string | null
  actionLabel: string | null
}

export interface DashboardRecommendation {
  title: string
  message: string
  href: string
  actionLabel: string
}

export interface DashboardSummary {
  email: string
  kycStatus: "NOT_STARTED" | "PENDING" | "VERIFIED"
  preferredFiatCurrency: FiatCurrency
  netAccountValueUsd: number
  totalAssetsUsd: number
  totalDebtUsd: number
  availableUsd: number
  earnPrincipalUsd: number
  collateralUsd: number
  accruedEarnRewardsUsd: number
  activeLoanCount: number
  highestLtvPercent: number
  borrowHealth: BorrowHealth
  activeEarnPositionCount: number
  weightedAverageEarnApy: number
  nextEarnMaturityDate: string | null
  priceSource: PriceSource
  pricesUpdatedAt: string | null
  pricesStale: boolean
  alerts: DashboardAlert[]
  recommendation: DashboardRecommendation
  recentTransactions: WalletTransaction[]
}

export interface MarketPricePoint {
  timestamp: string
  price: number
}

export interface MarketPriceHistory {
  asset: AssetSymbol
  quoteCurrency: FiatCurrency
  range: MarketRange
  currentPrice: number
  changeAmount: number
  changePercent: number
  minimumPrice: number
  maximumPrice: number
  source: PriceSource
  updatedAt: string | null
  stale: boolean
  points: MarketPricePoint[]
}

export function apiDashboardToDashboard(api: ApiDashboardSummary): DashboardSummary {
  const recommendation = api.recommendation
  return {
    email: api.email ?? "",
    kycStatus: api.kycStatus ?? "NOT_STARTED",
    preferredFiatCurrency: (api.preferredFiatCurrency ?? "USD") as FiatCurrency,
    netAccountValueUsd: Number(api.netAccountValueUsd),
    totalAssetsUsd: Number(api.totalAssetsUsd),
    totalDebtUsd: Number(api.totalDebtUsd),
    availableUsd: Number(api.availableUsd),
    earnPrincipalUsd: Number(api.earnPrincipalUsd),
    collateralUsd: Number(api.collateralUsd),
    accruedEarnRewardsUsd: Number(api.accruedEarnRewardsUsd),
    activeLoanCount: Number(api.activeLoanCount),
    highestLtvPercent: Number(api.highestLtvPercent),
    borrowHealth: (api.borrowHealth ?? "NONE") as BorrowHealth,
    activeEarnPositionCount: Number(api.activeEarnPositionCount),
    weightedAverageEarnApy: Number(api.weightedAverageEarnApy),
    nextEarnMaturityDate: api.nextEarnMaturityDate ?? null,
    priceSource: (api.priceSource ?? "STATIC_FALLBACK") as PriceSource,
    pricesUpdatedAt: api.pricesUpdatedAt ?? null,
    pricesStale: Boolean(api.pricesStale),
    alerts: (api.alerts ?? []).map((alert) => ({
      severity: (alert.severity ?? "INFO") as AlertSeverity,
      title: alert.title ?? "Account notice",
      message: alert.message ?? "",
      href: alert.href ?? null,
      actionLabel: alert.actionLabel ?? null,
    })),
    recommendation: {
      title: recommendation?.title ?? "Explore HashWhale",
      message: recommendation?.message ?? "Review your account products.",
      href: recommendation?.href ?? "/wallet",
      actionLabel: recommendation?.actionLabel ?? "Get started",
    },
    recentTransactions: (api.recentTransactions ?? []).map(apiTransactionToTransaction),
  }
}

export function apiMarketHistoryToMarketHistory(api: ApiMarketHistory): MarketPriceHistory {
  return {
    asset: (api.asset ?? "BTC") as AssetSymbol,
    quoteCurrency: (api.quoteCurrency ?? "USD") as FiatCurrency,
    range: (api.range ?? "7D") as MarketRange,
    currentPrice: Number(api.currentPrice),
    changeAmount: Number(api.changeAmount),
    changePercent: Number(api.changePercent),
    minimumPrice: Number(api.minimumPrice),
    maximumPrice: Number(api.maximumPrice),
    source: (api.source ?? "STATIC_FALLBACK") as PriceSource,
    updatedAt: api.updatedAt ?? null,
    stale: Boolean(api.stale),
    points: (api.points ?? []).map((point) => ({
      timestamp: point.timestamp ?? "",
      price: Number(point.price),
    })),
  }
}

export function fiatFormatter(currency: FiatCurrency, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  })
}

export function accountName(email: string): string {
  const localPart = email.split("@")[0] || "there"
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
