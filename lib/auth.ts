const AUTH_TOKEN_KEY = "hw_token"
const USER_ID_KEY = "hw_user_id"
const AUTH_NOTICE_KEY = "hw_auth_notice"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getUserId(): number | null {
  if (typeof window === "undefined") return null
  const id = localStorage.getItem(USER_ID_KEY)
  return id ? Number(id) : null
}

export function setUserId(id: number) {
  localStorage.setItem(USER_ID_KEY, String(id))
}

export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY)
}

export function clearAuth() {
  clearToken()
  clearUserId()
}

export function isTokenExpired(token: string, nowMs = Date.now()): boolean {
  try {
    const payloadSegment = token.split(".")[1]
    if (!payloadSegment) return true

    const base64 = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=")
    const payload = JSON.parse(atob(base64)) as { exp?: unknown }

    return typeof payload.exp !== "number" || nowMs >= payload.exp * 1000
  } catch {
    return true
  }
}

export function setAuthNotice(message: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(AUTH_NOTICE_KEY, message)
}

export function consumeAuthNotice(): string | null {
  if (typeof window === "undefined") return null
  const message = sessionStorage.getItem(AUTH_NOTICE_KEY)
  sessionStorage.removeItem(AUTH_NOTICE_KEY)
  return message
}
