"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Field } from "./field"
import { Wordmark } from "./wordmark"
import { KycStatus, type KycState } from "./kyc-status"
import { api } from "@/lib/api"
import { consumeAuthNotice, setToken, setUserId } from "@/lib/auth"

type SubmitResult = { ok: true } | { ok: false; message: string }

async function handleLogin(values: {
  email: string
  password: string
}): Promise<SubmitResult> {
  const { data, error } = await api.POST("/api/auth/login", {
    body: { email: values.email, password: values.password },
  })

  if (error) {
    const message =
      (error as { message?: string })?.message ?? "Incorrect email or password. Please try again."
    return { ok: false, message }
  }

  if (data?.token) {
    setToken(data.token)

    const { data: me } = await api.GET("/api/auth/me")
    if (me?.id) {
      setUserId(me.id)
    }
  }

  return { ok: true }
}

async function handleSignup(values: {
  email: string
  password: string
  confirmPassword: string
  countryCode: CountryCode
}): Promise<SubmitResult> {
  const { error } = await api.POST("/api/auth/register", {
    body: { email: values.email, password: values.password, countryCode: values.countryCode },
  })

  if (error) {
    const message =
      (error as { message?: string })?.message ?? "Could not create account. Please try again."
    return { ok: false, message }
  }

  // Registration succeeded — do NOT auto-login. Caller sends the user back
  // to the Log In tab with a success message instead.
  return { ok: true }
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "CH", name: "Switzerland" },
  { code: "PH", name: "Philippines" },
] as const

type CountryCode = (typeof COUNTRIES)[number]["code"]

type Mode = "login" | "signup"

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  country?: string
  form?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthCard() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [countryCode, setCountryCode] = useState<CountryCode | "">("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)

  // KYC status is hidden by default — flip `show` on once wired to real data.
  const [kyc] = useState<KycState>("not_started")

  const loginTabRef = useRef<HTMLButtonElement>(null)
  const authNoticeReadRef = useRef(false)

  useEffect(() => {
    if (authNoticeReadRef.current) return
    authNoticeReadRef.current = true
    setAuthNotice(consumeAuthNotice())
  }, [])

  function switchMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    setErrors({})
    setStatus("idle")
    setSuccessMessage(null)
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!email.trim()) next.email = "Email is required"
    else if (!EMAIL_RE.test(email)) next.email = "Please enter a valid email address"

    if (!password) next.password = "Password is required"
    else if (password.length < 8) next.password = "Password must be at least 8 characters"

    if (mode === "signup") {
      if (!confirmPassword) next.confirmPassword = "Please confirm your password"
      else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match"
      if (!countryCode) next.country = "Please select your country"
    }
    return next
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus("loading")
    setSuccessMessage(null)
    setAuthNotice(null)

    const result =
      mode === "login"
        ? await handleLogin({ email, password })
        : await handleSignup({ email, password, confirmPassword, countryCode: countryCode as CountryCode })

    if (result.ok) {
      if (mode === "signup") {
        // Switch to Log In tab, show success message, clear passwords, keep email
        setStatus("idle")
        setPassword("")
        setConfirmPassword("")
        setMode("login")
        setErrors({})
        setSuccessMessage("Account created successfully. Please log in.")
      } else {
        // Login succeeded — go into the app
        setStatus("success")
        router.push("/dashboard")
      }
    } else {
      setStatus("idle")
      setErrors({ form: result.message })
    }
  }

  const submitLabel = useMemo(() => {
    if (status === "success") return "Welcome back"
    return mode === "login" ? "Log In" : "Create account"
  }, [status, mode])

  return (
    <div className="hw-card-in hw-card relative z-10 w-full max-w-[420px] p-7 sm:p-8">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <Wordmark />
      </div>

      {/* Tab switcher */}
      <div className="hw-tabs relative mb-6 grid grid-cols-2 p-1">
        <span
          className="hw-tab-indicator absolute inset-y-1 w-[calc(50%-4px)]"
          style={{ transform: mode === "login" ? "translateX(4px)" : "translateX(calc(100% + 4px))" }}
          aria-hidden="true"
        />
        <button
          ref={loginTabRef}
          type="button"
          onClick={() => switchMode("login")}
          className="relative z-10 rounded-lg py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: mode === "login" ? "var(--hw-text)" : "var(--hw-muted)" }}
          aria-pressed={mode === "login"}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="relative z-10 rounded-lg py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: mode === "signup" ? "var(--hw-text)" : "var(--hw-muted)" }}
          aria-pressed={mode === "signup"}
        >
          Sign Up
        </button>
      </div>

      {/* Success message (e.g. after signup) */}
      {successMessage ? (
        <div
          className="hw-fade-slide mb-4 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            color: "var(--hw-primary)",
            background: "var(--hw-primary-soft)",
            border: "1px solid rgba(13, 83, 255, 0.3)",
          }}
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      {authNotice ? (
        <div
          className="hw-fade-slide mb-4 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            color: "var(--hw-error)",
            background: "rgba(255, 100, 13, 0.1)",
            border: "1px solid rgba(255, 100, 13, 0.3)",
          }}
          role="alert"
        >
          {authNotice}
        </div>
      ) : null}

      {/* Form-level error */}
      {errors.form ? (
        <div
          className="hw-fade-slide mb-4 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{
            color: "var(--hw-error)",
            background: "rgba(255, 100, 13, 0.1)",
            border: "1px solid rgba(255, 100, 13, 0.3)",
          }}
          role="alert"
        >
          {errors.form}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div key={mode} className="hw-fade-slide flex flex-col gap-4">
          <Field id="email" label="Email" error={errors.email}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`hw-input h-11 w-full px-3.5 text-sm ${errors.email ? "hw-input-error" : ""}`}
            />
          </Field>

          <Field id="password" label="Password" error={errors.password}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`hw-input h-11 w-full pl-3.5 pr-11 text-sm ${errors.password ? "hw-input-error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
              style={{ color: "var(--hw-muted)" }}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>
        </div>

        {/* Sign-up-only fields — expand/slide in smoothly */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: mode === "signup" ? "220px" : "0px",
            opacity: mode === "signup" ? 1 : 0,
          }}
          aria-hidden={mode !== "signup"}
        >
          <div className="flex flex-col gap-4 pt-0.5">
            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                tabIndex={mode === "signup" ? 0 : -1}
                className={`hw-input h-11 w-full px-3.5 text-sm ${errors.confirmPassword ? "hw-input-error" : ""}`}
              />
            </Field>

            <Field id="country" label="Country" error={errors.country}>
              <select
                id="country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                tabIndex={mode === "signup" ? 0 : -1}
                className={`hw-input h-11 w-full appearance-none px-3.5 text-sm ${
                  errors.country ? "hw-input-error" : ""
                }`}
                style={{ color: countryCode ? "var(--hw-text)" : "var(--hw-muted)" }}
              >
                <option value="" disabled>
                  Select your country
                </option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} style={{ color: "#0a0e1a" }}>
                    {country.name}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--hw-muted)" }}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={status !== "idle"}
          className="hw-submit mt-1 flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "login" ? "Logging in…" : "Creating account…"}
            </>
          ) : (
            submitLabel
          )}
        </button>

        {mode === "login" ? (
          <button
            type="button"
            onClick={() => console.log("[v0] forgot password")}
            className="mx-auto text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--hw-primary)" }}
          >
            Forgot your password?
          </button>
        ) : (
          <p className="text-center text-xs leading-relaxed" style={{ color: "var(--hw-muted)" }}>
            By creating an account you agree to HashWhale&apos;s Terms of Service and Privacy Policy.
          </p>
        )}
      </form>

      {/* Hidden by default — reveal when wiring real KYC data */}
      <KycStatus state={kyc} show={false} />
    </div>
  )
}
