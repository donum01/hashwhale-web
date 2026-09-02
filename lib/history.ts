export const HISTORY_BATCH_SIZE = 10

export interface HistoryPageState {
  hasMore: boolean
  nextCursor: number | null
}

export function historyPageState(response: Response, itemCount: number): HistoryPageState {
  const hasMoreHeader = response.headers.get("X-Has-More")
  const cursorHeader = response.headers.get("X-Next-Cursor")
  const parsedCursor = cursorHeader ? Number.parseInt(cursorHeader, 10) : Number.NaN

  return {
    hasMore: hasMoreHeader == null ? itemCount === HISTORY_BATCH_SIZE : hasMoreHeader === "true",
    nextCursor: Number.isFinite(parsedCursor) ? parsedCursor : null,
  }
}
