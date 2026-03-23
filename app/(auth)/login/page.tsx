"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight, Shield, Zap, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "#fefcfb" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #fae1dd 0%, #fcd5ce 50%, #fec5bb 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#f27202" }}
            >
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: "#3b2e1f" }}
            >
              GxMail
            </span>
          </div>
          <p className="text-sm" style={{ color: "#775d3f" }}>
            by Glxymesh
          </p>
        </div>

        <div className="space-y-8">
          <h1
            className="text-4xl font-bold leading-tight"
            style={{ color: "#3b2e1f" }}
          >
            Your email,
            <br />
            reimagined.
          </h1>
          <p
            className="text-lg max-w-md"
            style={{ color: "#775d3f" }}
          >
            A beautiful, fast, and intelligent email client powered by Zoho Mail.
            Manage all your emails from one sleek interface.
          </p>

          <div className="space-y-4">
            {[
              { icon: Shield, text: "Secure OAuth authentication" },
              { icon: Zap, text: "Lightning-fast cached performance" },
              { icon: Sparkles, text: "AI-ready architecture" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#fff4eb" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#f27202" }} />
                </div>
                <span style={{ color: "#3b2e1f" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "#ad8b63" }}>
          Glxymesh &middot; {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#f27202" }}
            >
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: "#3b2e1f" }}
            >
              GxMail
            </span>
          </div>

          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "#3b2e1f" }}
            >
              Get started
            </h2>
            <p className="mt-2" style={{ color: "#775d3f" }}>
              Connect your Zoho Mail account to begin managing your emails.
            </p>
          </div>

          <Button
            onClick={() => signIn("zoho", { callbackUrl: "/inbox" })}
            className="w-full h-12 text-base font-medium rounded-xl gap-3 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #fec89a 0%, #f27202 100%)",
              color: "#ffffff",
              border: "none",
            }}
          >
            <Mail className="w-5 h-5" />
            Connect with Zoho Mail
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "#fff4eb" }}
          >
            <p className="text-sm font-medium" style={{ color: "#3b2e1f" }}>
              What happens next?
            </p>
            <ul className="text-sm space-y-1" style={{ color: "#775d3f" }}>
              <li>1. You&apos;ll be redirected to Zoho for secure login</li>
              <li>2. Grant GxMail access to read and send emails</li>
              <li>3. Your emails will sync automatically</li>
            </ul>
          </div>

          <p className="text-xs text-center" style={{ color: "#ad8b63" }}>
            Your credentials are handled securely via OAuth 2.0.
            <br />
            GxMail never stores your Zoho password.
          </p>
        </div>
      </div>
    </div>
  )
}
