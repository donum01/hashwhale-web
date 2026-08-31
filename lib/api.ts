import createClient from "openapi-fetch"
import type { paths } from "./api-schema"
import { getToken } from "./auth"

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
})

api.use({
  onRequest({ request }) {
    const token = getToken()
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`)
    }
    return request
  },
})