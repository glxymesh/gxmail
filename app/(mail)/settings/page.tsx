"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Mail,
  Plus,
  Trash2,
  Star,
  Check,
  ExternalLink,
  User,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface LinkedAccount {
  id: string
  provider: string
  email: string
  displayName: string
  isDefault: boolean
  linkedAt: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<LinkedAccount | null>(null)

  const { data: accounts, isLoading } = useQuery<LinkedAccount[]>({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts/linked")
      if (!res.ok) throw new Error("Failed to fetch accounts")
      return res.json()
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/accounts/linked/${accountId}/default`, { method: "PUT" })
      if (!res.ok) throw new Error("Failed to set default")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-accounts"] })
      toast.success("Default account updated")
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/accounts/linked/${accountId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to unlink")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success("Account disconnected")
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error("Failed to disconnect account")
    },
  })

  const providerIcon = (provider: string) => {
    switch (provider) {
      case "zoho": return <Mail className="w-5 h-5" style={{ color: "#48b8d0" }} />
      case "gmail": return <Mail className="w-5 h-5" style={{ color: "#d93025" }} />
      default: return <Mail className="w-5 h-5" style={{ color: "#7b3e19" }} />
    }
  }

  const providerLabel = (provider: string) => {
    switch (provider) {
      case "zoho": return "Zoho Mail"
      case "gmail": return "Gmail"
      case "outlook": return "Outlook"
      default: return provider
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#2d1a0e" }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: "#b28b84" }}>
            Manage your account and connected email providers
          </p>
        </div>

        {/* Profile section */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "#e8ddf0", background: "#fdfbfe" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4" style={{ color: "#7b3e19" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#2d1a0e" }}>Profile</h2>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: "#e8ddf0", color: "#7b3e19" }}
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium" style={{ color: "#2d1a0e" }}>
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm" style={{ color: "#b28b84" }}>
                {session?.user?.email || ""}
              </p>
              <div
                className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "#eef9fd", color: "#48b8d0" }}
              >
                <Shield className="w-2.5 h-2.5" />
                Glxymesh ID
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "#e8ddf0", background: "#fdfbfe" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: "#7b3e19" }} />
              <h2 className="font-semibold text-sm" style={{ color: "#2d1a0e" }}>
                Connected Email Accounts
              </h2>
            </div>
            <a href="/api/accounts/link/zoho">
              <Button
                size="sm"
                className="gap-1.5 rounded-lg cursor-pointer"
                style={{ background: "#7b3e19", color: "#ffffff" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Account
              </Button>
            </a>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3"
                style={{ background: "#f5e5fc" }}
              >
                <Mail className="w-6 h-6" style={{ color: "#b28b84" }} />
              </div>
              <p className="text-sm" style={{ color: "#7b3e19" }}>No email accounts connected</p>
              <p className="text-xs mt-1" style={{ color: "#b28b84" }}>
                Connect an account to start managing your emails
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                  style={{
                    borderColor: account.isDefault ? "#48b8d0" : "#e8ddf0",
                    background: account.isDefault ? "#eef9fd" : "#ffffff",
                  }}
                >
                  {/* Provider icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: account.isDefault ? "#ffffff" : "#f5e5fc" }}
                  >
                    {providerIcon(account.provider)}
                  </div>

                  {/* Account info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate" style={{ color: "#2d1a0e" }}>
                        {account.displayName || account.email}
                      </p>
                      {account.isDefault && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: "#48b8d0", color: "#ffffff" }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "#b28b84" }}>
                      {account.email} · {providerLabel(account.provider)}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#b28b84" }}>
                      Connected {new Date(account.linkedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(account.id)}
                        className="gap-1 text-xs cursor-pointer"
                        style={{ color: "#7b3e19" }}
                      >
                        <Star className="w-3 h-3" />
                        Set default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(account)}
                      className="cursor-pointer"
                      style={{ color: "#d93025" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" style={{ background: "#efe6f5" }} />

          {/* Add more providers */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "#b28b84" }}>
              More providers
            </p>
            <div className="flex gap-2">
              <a href="/api/accounts/link/zoho">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg cursor-pointer"
                  style={{ borderColor: "#e8ddf0", color: "#2d1a0e" }}
                >
                  <Mail className="w-3.5 h-3.5" style={{ color: "#48b8d0" }} />
                  Zoho Mail
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 rounded-lg"
                style={{ borderColor: "#e8ddf0", color: "#b28b84" }}
              >
                <Mail className="w-3.5 h-3.5" />
                Gmail
                <span className="text-[10px]">(Soon)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Disconnect confirmation dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent
            className="rounded-xl"
            style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "#2d1a0e" }}>
                Disconnect {deleteTarget?.email}?
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: "#b28b84" }}>
                This will remove access to this email account and delete all cached emails.
                You can reconnect it later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-lg"
                style={{ borderColor: "#e8ddf0", color: "#7b3e19" }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && unlinkMutation.mutate(deleteTarget.id)}
                className="rounded-lg"
                style={{ background: "#d93025", color: "#ffffff" }}
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
