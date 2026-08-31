/* ===========================================================================
   HASHWHALE — WALLET DATA LAYER
=========================================================================== */

import type { components } from "./api-schema"
import { ASSETS, type AssetSymbol } from "./borrow"
import { ASSET_LIST } from "./borrow"


type ApiWalletBalance = components["schemas"]["WalletBalanceResponse"]
type ApiTransaction = components["schemas"]["TransactionResponse"]

export interface WalletBalance {
  asset: AssetSymbol
  availableAmount: number
  lockedAmount: number
}

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "BORROW"
  | "REPAY"
  | "EARN_SUBSCRIBE"
  | "EARN_WITHDRAW"

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED"

export interface WalletTransaction {
  type: TransactionType
  asset: AssetSymbol
  amount: number
  status: TransactionStatus
  createdAt: string
}

export function apiBalanceToBalance(apiBalance: ApiWalletBalance): WalletBalance {
  return {
    asset: apiBalance.asset as AssetSymbol,
    availableAmount: Number(apiBalance.availableAmount),
    lockedAmount: Number(apiBalance.lockedAmount),
  }
}

export function apiTransactionToTransaction(apiTx: ApiTransaction): WalletTransaction {
  return {
    type: apiTx.type as TransactionType,
    asset: apiTx.asset as AssetSymbol,
    amount: Number(apiTx.amount),
    status: apiTx.status as TransactionStatus,
    createdAt: apiTx.createdAt!,
  }
}

export function balanceValueUsd(balance: WalletBalance): number {
  return (balance.availableAmount + balance.lockedAmount) * ASSETS[balance.asset].price
}

export function totalPortfolioValue(balances: WalletBalance[]): number {
  return balances.reduce((sum, b) => sum + balanceValueUsd(b), 0)
}

/** Ensures every known asset has a balance entry, even if the user has 
    never deposited it (shown as zero). Keeps the grid visually complete. */
export function withAllAssets(balances: WalletBalance[]): WalletBalance[] {
  return ASSET_LIST.map((config) => {
    const existing = balances.find((b) => b.asset === config.symbol)
    return existing ?? { asset: config.symbol, availableAmount: 0, lockedAmount: 0 }
  })
}

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdraw",
  BORROW: "Borrow",
  REPAY: "Repay",
  EARN_SUBSCRIBE: "Earn Subscribe",
  EARN_WITHDRAW: "Earn Withdraw",
}

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})