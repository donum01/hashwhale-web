"use client"

import { useEffect, useState } from "react"
import { getUserId } from "./auth"

export function useAuthUser() {
  const [userId, setUserId] = useState<number | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    setUserId(getUserId())
    setAuthReady(true)
  }, [])

  return { userId, authReady }
}
