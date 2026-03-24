"use client"

import { useState, useEffect } from "react"
import { Mail, ArrowRight, AlertCircle } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Authorization was cancelled. Please try again.",
  invalid_state: "Invalid session. Please try again.",
  linking_failed: "Failed to connect your account. Please try again.",
}

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setError(params.get("error"))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#fdfbfe" }}>
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#7b3e19" }}
          >
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#2d1a0e" }}>
            Welcome to GxMail
          </h1>
          <p className="mt-2" style={{ color: "#7b3e19" }}>
            Connect your email account to get started
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: "#fef2f1", color: "#d93025" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {ERROR_MESSAGES[error] || "Something went wrong. Please try again."}
          </div>
        )}

        {/* Provider cards */}
        <div className="space-y-3">
          {/* Zoho Mail */}
          <a
            href="/api/accounts/link/zoho"
            className="flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer"
            style={{ borderColor: "#e8ddf0", background: "#ffffff" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#48b8d0"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(72,184,208,0.1)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e8ddf0"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#eef9fd" }}
            >
              <Mail className="w-6 h-6" style={{ color: "#48b8d0" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm" style={{ color: "#2d1a0e" }}>Zoho Mail</p>
              <p className="text-xs" style={{ color: "#b28b84" }}>Connect your Zoho Mail account</p>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: "#b28b84" }} />
          </a>

          {/* Gmail — coming soon */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl border opacity-50"
            style={{ borderColor: "#e8ddf0", background: "#fdfbfe" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#f5e5fc" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 6L12 13L2 6" stroke="#b28b84" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#b28b84" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm" style={{ color: "#2d1a0e" }}>Gmail</p>
              <p className="text-xs" style={{ color: "#b28b84" }}>Coming soon</p>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#f5e5fc", color: "#7b3e19" }}
            >
              Soon
            </span>
          </div>
        </div>

        <p className="text-xs" style={{ color: "#b28b84" }}>
          Your credentials are handled securely via OAuth 2.0.
          <br />
          GxMail never stores your email password.
        </p>
      </div>
    </div>
  )
}
