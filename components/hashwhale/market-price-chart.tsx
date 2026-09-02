"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Loader2, Radio } from "lucide-react"
import { api } from "@/lib/api"
import { ASSETS, type AssetSymbol } from "@/lib/borrow"
import {
  apiMarketHistoryToMarketHistory,
  fiatFormatter,
  type MarketPriceHistory,
  type MarketRange,
} from "@/lib/dashboard"
import { AssetChip } from "./asset-chip"

const ASSET_OPTIONS: AssetSymbol[] = ["BTC", "ETH", "USDT"]
const RANGE_OPTIONS: MarketRange[] = ["1D", "7D", "30D", "90D"]
const CHART_WIDTH = 760
const CHART_HEIGHT = 300
const PADDING = { top: 18, right: 72, bottom: 30, left: 12 }
const SELECTION_DEBOUNCE_MS = 200

function chartGeometry(history: MarketPriceHistory) {
  const prices = history.points.map((point) => point.price)
  const rawMinimum = Math.min(...prices)
  const rawMaximum = Math.max(...prices)
  const spread = rawMaximum - rawMinimum
  const minimumPadding = Math.max(history.currentPrice * 0.002, 0.000001)
  const padding = Math.max(spread * 0.12, minimumPadding)
  const minimum = rawMinimum - padding
  const maximum = rawMaximum + padding
  const usableWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const usableHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const coordinates = history.points.map((point, index) => {
    const x = PADDING.left + (history.points.length === 1 ? 0 : (index / (history.points.length - 1)) * usableWidth)
    const y = PADDING.top + ((maximum - point.price) / (maximum - minimum)) * usableHeight
    return { x, y, point }
  })
  const linePath = coordinates.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  const areaPath = coordinates.length
    ? `${linePath} L ${coordinates.at(-1)!.x} ${CHART_HEIGHT - PADDING.bottom} L ${coordinates[0].x} ${CHART_HEIGHT - PADDING.bottom} Z`
    : ""
  return { coordinates, linePath, areaPath, minimum, maximum, spread }
}

export function MarketPriceChart() {
  const [asset, setAsset] = useState<AssetSymbol>("BTC")
  const [range, setRange] = useState<MarketRange>("7D")
  const [history, setHistory] = useState<MarketPriceHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const requestSequence = useRef(0)
  const activeRequestController = useRef<AbortController | null>(null)
  const historyCache = useRef(new Map<string, MarketPriceHistory>())

  const loadHistory = useCallback(async (background = false) => {
    activeRequestController.current?.abort()
    const controller = new AbortController()
    activeRequestController.current = controller
    const requestId = ++requestSequence.current
    const cacheKey = `${asset}:${range}`
    if (background) setRefreshing(true)
    else {
      setRefreshing(false)
      setLoading(true)
    }
    try {
      const { data, error: apiError } = await api.GET("/api/market/prices/{asset}/history", {
        params: { path: { asset }, query: { range } },
        cache: "no-store",
        signal: controller.signal,
      })
      if (requestId !== requestSequence.current) return
      if (apiError || !data) {
        setError((apiError as { message?: string } | undefined)?.message ?? "Market history is unavailable.")
        return
      }
      const nextHistory = apiMarketHistoryToMarketHistory(data)
      historyCache.current.set(cacheKey, nextHistory)
      setHistory(nextHistory)
      setError(null)
    } catch (requestError) {
      if (requestId !== requestSequence.current) return
      if (requestError instanceof DOMException && requestError.name === "AbortError") return
      setError("Could not reach the market-data service.")
    } finally {
      if (requestId === requestSequence.current && activeRequestController.current === controller) {
        activeRequestController.current = null
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [asset, range])

  useEffect(() => {
    activeRequestController.current?.abort()
    requestSequence.current += 1
    const cachedHistory = historyCache.current.get(`${asset}:${range}`) ?? null
    setHistory(cachedHistory)
    setHoveredIndex(null)
    setError(null)
    setRefreshing(false)
    setLoading(!cachedHistory)
    const debounceTimer = window.setTimeout(
      () => void loadHistory(Boolean(cachedHistory)),
      SELECTION_DEBOUNCE_MS,
    )
    return () => {
      window.clearTimeout(debounceTimer)
      activeRequestController.current?.abort()
      requestSequence.current += 1
    }
  }, [loadHistory])

  useEffect(() => {
    const pollMs = range === "1D" ? 60_000 : 5 * 60_000
    const interval = window.setInterval(() => void loadHistory(true), pollMs)
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void loadHistory(true)
    }
    window.addEventListener("focus", refreshVisible)
    document.addEventListener("visibilitychange", refreshVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshVisible)
      document.removeEventListener("visibilitychange", refreshVisible)
    }
  }, [loadHistory, range])

  const geometry = useMemo(() => history && history.points.length > 1 ? chartGeometry(history) : null, [history])
  const currency = history ? fiatFormatter(history.quoteCurrency) : null
  const selectedPoint = hoveredIndex != null && geometry ? geometry.coordinates[hoveredIndex] : null
  const positive = (history?.changePercent ?? 0) >= 0
  const changeColor = positive ? "var(--hw-ltv-safe)" : "var(--hw-error)"
  const chartColor = ASSETS[asset].color
  const zoomedScale = Boolean(history && geometry && geometry.spread / history.currentPrice < 0.01)

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!geometry || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH
    let nearest = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    geometry.coordinates.forEach((coordinate, index) => {
      const distance = Math.abs(coordinate.x - svgX)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = index
      }
    })
    setHoveredIndex(nearest)
  }

  function formatTimestamp(timestamp: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: range === "1D" ? "numeric" : undefined,
      minute: range === "1D" ? "2-digit" : undefined,
    }).format(new Date(timestamp))
  }

  return (
    <section className="hw-card overflow-hidden p-5 sm:p-6" aria-labelledby="market-chart-heading">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="market-chart-heading" className="text-xl font-bold" style={{ color: "var(--hw-text)" }}>
              Price history
            </h2>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--hw-primary)" }} /> : null}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--hw-muted)" }}>
            Stored market prices collected automatically in the background.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="hw-tabs flex gap-1 overflow-x-auto p-1" aria-label="Select market asset">
            {ASSET_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAsset(option)}
                className="flex min-w-20 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  background: asset === option ? "var(--hw-indicator)" : "transparent",
                  color: asset === option ? "var(--hw-text)" : "var(--hw-muted)",
                }}
                aria-pressed={asset === option}
              >
                <AssetChip asset={option} size={20} /> {option}
              </button>
            ))}
          </div>
          <div className="hw-tabs grid grid-cols-4 gap-1 p-1" aria-label="Select chart period">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className="rounded-lg px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  background: range === option ? "var(--hw-indicator)" : "transparent",
                  color: range === option ? "var(--hw-text)" : "var(--hw-muted)",
                }}
                aria-pressed={range === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 animate-pulse">
          <div className="h-9 w-44 rounded-lg" style={{ background: "var(--hw-track)" }} />
          <div className="mt-6 h-[300px] rounded-xl" style={{ background: "var(--hw-track)" }} />
        </div>
      ) : !history || !geometry || !currency ? (
        <div className="mt-6 flex min-h-[330px] flex-col items-center justify-center gap-3 rounded-xl text-center" style={{ background: "var(--hw-track)" }}>
          <AlertTriangle className="h-7 w-7" style={{ color: "var(--hw-ltv-warn)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--hw-text)" }}>{error ?? "No market history available."}</p>
          <button type="button" onClick={() => void loadHistory()} className="hw-btn-outline px-4 py-2 text-xs font-bold">
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <AssetChip asset={asset} size={42} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: "var(--hw-text)" }}>
                    {currency.format(history.currentPrice)}
                  </p>
                  <span className="text-xs font-semibold" style={{ color: "var(--hw-muted)" }}>
                    {asset}/{history.quoteCurrency}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold tabular-nums" style={{ color: changeColor }}>
                  {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {positive ? "+" : ""}{history.changePercent.toFixed(2)}% · {positive ? "+" : ""}{currency.format(history.changeAmount)}
                  <span className="ml-1 font-normal" style={{ color: "var(--hw-muted)" }}>over {range}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-semibold"
                style={{
                  color: history.source === "COINGECKO" && !history.stale ? "var(--hw-ltv-safe)" : "var(--hw-ltv-warn)",
                  background: "var(--hw-track)",
                }}
              >
                <Radio className="h-3 w-3" />
                {history.source === "COINGECKO"
                  ? history.stale ? "Stale · CoinGecko" : "Current · CoinGecko"
                  : history.source === "STATIC_FALLBACK"
                    ? "Fallback · history unavailable"
                    : "Configured price"}
              </span>
              {history.updatedAt ? (
                <span style={{ color: "var(--hw-muted)" }}>
                  Updated {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(history.updatedAt))}
                </span>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-xs" style={{ color: "var(--hw-ltv-warn)" }} role="status">
              {error} Showing the last available series.
            </p>
          ) : null}

          <div className="relative mt-5 min-h-[300px] w-full select-none">
            {selectedPoint ? (
              <div
                className="pointer-events-none absolute left-3 top-2 z-10 rounded-lg px-3 py-2 text-xs shadow-lg sm:left-auto sm:right-3"
                style={{ background: "var(--hw-indicator)", color: "var(--hw-text)", border: "1px solid var(--hw-input-border)" }}
              >
                <p className="font-bold tabular-nums">{currency.format(selectedPoint.point.price)}</p>
                <p className="mt-0.5" style={{ color: "var(--hw-muted)" }}>{formatTimestamp(selectedPoint.point.timestamp)}</p>
              </div>
            ) : null}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="h-auto min-h-[260px] w-full touch-none overflow-visible"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoveredIndex(null)}
              role="img"
              aria-label={`${ASSETS[asset].name} price in ${history.quoteCurrency} over ${range}`}
            >
              <defs>
                <linearGradient id={`market-area-${asset}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = PADDING.top + ratio * (CHART_HEIGHT - PADDING.top - PADDING.bottom)
                const value = geometry.maximum - ratio * (geometry.maximum - geometry.minimum)
                return (
                  <g key={ratio}>
                    <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--hw-input-border)" strokeDasharray="4 6" />
                    <text x={CHART_WIDTH - PADDING.right + 9} y={y + 4} fill="var(--hw-muted)" fontSize="10">
                      {fiatFormatter(history.quoteCurrency, true).format(value)}
                    </text>
                  </g>
                )
              })}
              <path d={geometry.areaPath} fill={`url(#market-area-${asset})`} />
              <path className="hw-chart-line" pathLength={1} d={geometry.linePath} fill="none" stroke={chartColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {selectedPoint ? (
                <g>
                  <line x1={selectedPoint.x} x2={selectedPoint.x} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} stroke="var(--hw-muted)" strokeDasharray="3 4" />
                  <circle cx={selectedPoint.x} cy={selectedPoint.y} r="5" fill="var(--hw-card)" stroke={chartColor} strokeWidth="3" />
                </g>
              ) : null}
              {[0, Math.floor((history.points.length - 1) / 2), history.points.length - 1].map((index) => {
                const coordinate = geometry.coordinates[index]
                return (
                  <text key={index} x={coordinate.x} y={CHART_HEIGHT - 6} textAnchor={index === 0 ? "start" : index === history.points.length - 1 ? "end" : "middle"} fill="var(--hw-muted)" fontSize="10">
                    {formatTimestamp(coordinate.point.timestamp)}
                  </text>
                )
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs" style={{ borderColor: "var(--hw-input-border)", color: "var(--hw-muted)" }}>
            <span>Low <strong style={{ color: "var(--hw-text)" }}>{currency.format(history.minimumPrice)}</strong></span>
            {asset === "USDT" ? <span>Local quote defaults to your signup country</span> : null}
            <span>High <strong style={{ color: "var(--hw-text)" }}>{currency.format(history.maximumPrice)}</strong></span>
            {zoomedScale ? <span className="w-full text-center">Zoomed vertical scale highlights small price movements.</span> : null}
          </div>
        </div>
      )}
    </section>
  )
}
