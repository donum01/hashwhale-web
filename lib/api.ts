import createClient from "openapi-fetch"
import type { paths } from "./api-schema"
import { clearAuth, getToken, isTokenExpired, setAuthNotice } from "./auth"

const PUBLIC_AUTH_PATHS = new Set(["/api/auth/login", "/api/auth/register"])
const SESSION_EXPIRED_MESSAGE = "Your session expired. Please log in again."

let handlingExpiredSession = false

function isPublicAuthRequest(request: Request): boolean {
  return PUBLIC_AUTH_PATHS.has(new URL(request.url).pathname)
}

function handleExpiredSession() {
  if (typeof window === "undefined" || handlingExpiredSession) return

  handlingExpiredSession = true
  clearAuth()
  setAuthNotice(SESSION_EXPIRED_MESSAGE)
  window.location.replace("/")
}

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
})

api.use({
  onRequest({ request }) {
    if (isPublicAuthRequest(request)) return request

    const token = getToken()
    if (token) {
      if (isTokenExpired(token)) {
        handleExpiredSession()
        return request
      }
      request.headers.set("Authorization", `Bearer ${token}`)
    }
    return request
  },
  onResponse({ request, response }) {
    if (response.status === 401 && !isPublicAuthRequest(request)) {
      handleExpiredSession()
    }
    return response
  },
})
