export const usdValueFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const assetAmountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
})

export const rateFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAssetAmount(amount: number, asset: string): string {
  return `${assetAmountFormatter.format(amount)} ${asset}`
}

export function formatRate(rate: number): string {
  return `${rateFormatter.format(rate)}%`
}
