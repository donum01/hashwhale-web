import type { components } from "./api-schema"
import type { AssetSymbol } from "./borrow"

type ApiEarnProduct = components["schemas"]["EarnProductResponse"]
type ApiEarnPosition = components["schemas"]["EarnPositionResponse"]
type ApiEarnSummary = components["schemas"]["EarnSummaryResponse"]

export type EarnTermType = "FLEXIBLE" | "LOCKED_30" | "LOCKED_90"
export type EarnPositionStatus = "ACTIVE" | "WITHDRAWN"

export interface EarnProduct {
  id: string
  asset: AssetSymbol
  termType: EarnTermType
  apy: number
  termDays: number
  minimumAmount: number
  flexible: boolean
  active: boolean
}

export interface EarnPosition {
  id: number
  asset: AssetSymbol
  principalAmount: number
  apy: number
  termType: EarnTermType
  startDate: string
  endDate: string | null
  status: EarnPositionStatus
  accruedRewards: number
  estimatedRewardsAtMaturity: number | null
  withdrawable: boolean
  daysRemaining: number | null
}

export interface EarnSummary {
  totalPrincipalUsd: number
  accruedRewardsUsd: number
  weightedAverageApy: number
  activePositions: number
  nextMaturityDate: string | null
}

export function apiEarnProductToEarnProduct(product: ApiEarnProduct): EarnProduct {
  return {
    id: product.id!,
    asset: product.asset as AssetSymbol,
    termType: product.termType as EarnTermType,
    apy: Number(product.apy),
    termDays: Number(product.termDays),
    minimumAmount: Number(product.minimumAmount),
    flexible: Boolean(product.flexible),
    active: Boolean(product.active),
  }
}

export function apiEarnPositionToEarnPosition(position: ApiEarnPosition): EarnPosition {
  return {
    id: position.id!,
    asset: position.asset as AssetSymbol,
    principalAmount: Number(position.principalAmount),
    apy: Number(position.apy),
    termType: position.termType as EarnTermType,
    startDate: position.startDate!,
    endDate: position.endDate ?? null,
    status: position.status as EarnPositionStatus,
    accruedRewards: Number(position.accruedRewards),
    estimatedRewardsAtMaturity:
      position.estimatedRewardsAtMaturity == null
        ? null
        : Number(position.estimatedRewardsAtMaturity),
    withdrawable: Boolean(position.withdrawable),
    daysRemaining: position.daysRemaining == null ? null : Number(position.daysRemaining),
  }
}

export function apiEarnSummaryToEarnSummary(summary: ApiEarnSummary): EarnSummary {
  return {
    totalPrincipalUsd: Number(summary.totalPrincipalUsd),
    accruedRewardsUsd: Number(summary.accruedRewardsUsd),
    weightedAverageApy: Number(summary.weightedAverageApy),
    activePositions: Number(summary.activePositions),
    nextMaturityDate: summary.nextMaturityDate ?? null,
  }
}

export function earnTermLabel(termType: EarnTermType): string {
  if (termType === "FLEXIBLE") return "Flexible"
  if (termType === "LOCKED_30") return "30 days"
  return "90 days"
}

export function estimatedProductRewards(product: EarnProduct, amount: number): number {
  const earningDays = product.flexible ? 365 : product.termDays
  return amount * (product.apy / 100) * (earningDays / 365)
}

export const earnDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

export function formatEarnDate(date: string): string {
  return earnDateFormatter.format(new Date(`${date}T00:00:00Z`))
}
