"use client"

import { signOut } from "next-auth/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  LogOut,
  Settings,
  Keyboard,
  HelpCircle,
  RefreshCw,
  Mail,
  User,
} from "lucide-react"
import { triggerInitialSync } from "@/lib/actions/sync"
import { toast } from "sonner"

interface ZohoProfile {
  name: string
  email: string
  accountId?: string
  type?: string
}

export function UserProfileMenu() {
  const queryClient = useQueryClient()

  const { data: profile } = useQuery<ZohoProfile>({
    queryKey: ["zoho-profile"],
    queryFn: async () => {
      const res = await fetch("/api/mail/profile")
      if (!res.ok) throw new Error("Failed to fetch profile")
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 2,
  })

  const userName = profile?.name || "User"
  const userEmail = profile?.email || ""

  const initials = userName
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  async function handleResync() {
    toast.promise(
      async () => {
        await triggerInitialSync()
        queryClient.invalidateQueries({ queryKey: ["folders"] })
        queryClient.invalidateQueries({ queryKey: ["emails"] })
      },
      {
        loading: "Syncing emails...",
        success: "Sync complete",
        error: "Sync failed",
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative group flex items-center gap-2 rounded-full p-0.5 transition-all cursor-pointer outline-none focus-visible:ring-2"
          style={{ outlineColor: "#f27202" }}
        >
          {/* Avatar with gradient ring on hover */}
          <div className="relative">
            <div
              className="absolute -inset-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #fec89a, #f27202, #fcd5ce)",
              }}
            />
            <div
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: "#fcd5ce", color: "#3b2e1f" }}
            >
              {initials}
            </div>
          </div>

          {/* Online indicator dot */}
          <div
            className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{
              background: "#739781",
              borderColor: "#fefcfb",
            }}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl shadow-xl border overflow-hidden"
        style={{
          background: "#ffffff",
          borderColor: "#e8e8e4",
        }}
      >
        {/* Profile card header */}
        <div
          className="p-5 pb-4"
          style={{
            background: "linear-gradient(135deg, #fae1dd 0%, #fcd5ce 50%, #fec5bb 100%)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Large avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-sm shrink-0"
              style={{ background: "#ffffff", color: "#f27202" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-base font-semibold truncate"
                style={{ color: "#3b2e1f" }}
              >
                {userName}
              </p>
              {userEmail && (
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "#775d3f" }}
                >
                  {userEmail}
                </p>
              )}
              {/* Account badge */}
              <div
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  color: "#f27202",
                  backdropFilter: "blur(4px)",
                }}
              >
                <Mail className="w-3 h-3" />
                Zoho Mail
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={handleResync}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
            style={{ color: "#3b2e1f" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fff4eb" }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: "#f27202" }} />
            </div>
            <div>
              <p className="font-medium">Sync Now</p>
              <p className="text-xs" style={{ color: "#ad8b63" }}>
                Re-sync all folders & emails
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
            style={{ color: "#3b2e1f" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fff4eb" }}
            >
              <Keyboard className="w-4 h-4" style={{ color: "#f27202" }} />
            </div>
            <div>
              <p className="font-medium">Keyboard Shortcuts</p>
              <p className="text-xs" style={{ color: "#ad8b63" }}>
                View all shortcuts
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
            style={{ color: "#3b2e1f" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fff4eb" }}
            >
              <Settings className="w-4 h-4" style={{ color: "#f27202" }} />
            </div>
            <div>
              <p className="font-medium">Settings</p>
              <p className="text-xs" style={{ color: "#ad8b63" }}>
                Preferences & account
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
            style={{ color: "#3b2e1f" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fff4eb" }}
            >
              <HelpCircle className="w-4 h-4" style={{ color: "#f27202" }} />
            </div>
            <div>
              <p className="font-medium">Help & Feedback</p>
              <p className="text-xs" style={{ color: "#ad8b63" }}>
                Get support
              </p>
            </div>
          </DropdownMenuItem>
        </div>

        <Separator style={{ background: "#f1f1ee" }} />

        {/* Sign out */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
            style={{ color: "#f14122" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fef7f5" }}
            >
              <LogOut className="w-4 h-4" style={{ color: "#f14122" }} />
            </div>
            <p className="font-medium">Sign Out</p>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
