export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hw_token");
}

export function setToken(token: string) {
  localStorage.setItem("hw_token", token);
}

export function clearToken() {
  localStorage.removeItem("hw_token");
}

export function getUserId(): number | null {
  if (typeof window === "undefined") return null
  const id = localStorage.getItem("hw_user_id")
  return id ? Number(id) : null
}

export function setUserId(id: number) {
  localStorage.setItem("hw_user_id", String(id))
}

export function clearUserId() {
  localStorage.removeItem("hw_user_id")
}