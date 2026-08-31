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