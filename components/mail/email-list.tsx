"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEmails, type CachedEmail } from "@/hooks/use-emails"
import { useMailStore } from "@/stores/mail-store"
import { useToggleFlag } from "@/hooks/use-mail-actions"
import { EmailListItem } from "./email-list-item"
import { RefreshCw, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmailRowSkeleton } from "./mail-skeleton"
import { triggerIncrementalSync } from "@/lib/actions/sync"
import { useQueryClient } from "@tanstack/react-query"

interface EmailListProps {
  folderId: string | null
  folderName: string
}

export function EmailList({ folderId, folderName }: EmailListProps) {
  const { data: emails, isLoading } = useEmails(folderId)
  const { selectedEmailId, setSelectedEmail } = useMailStore()
  const toggleFlagMutation = useToggleFlag()
  const queryClient = useQueryClient()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: emails?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  })

  async function handleRefresh() {
    if (folderId) {
      await triggerIncrementalSync(folderId)
      queryClient.invalidateQueries({ queryKey: ["emails", folderId] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    }
  }

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8e8e4" }}>
          <h2 className="font-semibold" style={{ color: "#3b2e1f" }}>{folderName}</h2>
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f1f1ee" }}>
              <div className="w-8 h-8 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded skeleton-shimmer" />
                <div className="h-3 w-48 rounded skeleton-shimmer" />
                <div className="h-2 w-64 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8e8e4" }}>
          <h2 className="font-semibold" style={{ color: "#3b2e1f" }}>{folderName}</h2>
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className="w-4 h-4" style={{ color: "#775d3f" }} />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f8edeb" }}>
            <Inbox className="w-8 h-8" style={{ color: "#ad8b63" }} />
          </div>
          <p className="text-sm" style={{ color: "#775d3f" }}>No emails in {folderName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: "#e8e8e4" }}>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold" style={{ color: "#3b2e1f" }}>
            {folderName}
          </h2>
          <span className="text-xs" style={{ color: "#ad8b63" }}>
            {emails.length} emails
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="cursor-pointer">
          <RefreshCw className="w-4 h-4" style={{ color: "#775d3f" }} />
        </Button>
      </div>

      {/* Virtualized list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const email = emails[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <EmailListItem
                  email={email}
                  isSelected={selectedEmailId === email.messageId}
                  onSelect={() =>
                    setSelectedEmail(email.messageId, email.folderId)
                  }
                  onToggleFlag={() =>
                    toggleFlagMutation.mutate({
                      messageId: email.messageId,
                      isFlagged: !email.isFlagged,
                    })
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
