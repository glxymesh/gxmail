"use client"

import { useRef, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEmails, type CachedEmail } from "@/hooks/use-emails"
import { useMailStore } from "@/stores/mail-store"
import { useToggleFlag, useMarkAsRead } from "@/hooks/use-mail-actions"
import { EmailListItem } from "./email-list-item"
import { EmailContextMenu } from "./email-context-menu"
import { BulkActionBar } from "./bulk-action-bar"
import { RefreshCw, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmailRowSkeleton } from "./mail-skeleton"
import { triggerIncrementalSync } from "@/lib/actions/sync"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface EmailListProps {
  folderId: string | null
  folderName: string
}

export function EmailList({ folderId, folderName }: EmailListProps) {
  const { data: emails, isLoading } = useEmails(folderId)
  const {
    selectedEmailId,
    setSelectedEmail,
    selectedEmailIds,
    toggleEmailSelection,
    selectEmailRange,
    clearSelection,
  } = useMailStore()
  const toggleFlagMutation = useToggleFlag()
  const markAsReadMutation = useMarkAsRead()
  const queryClient = useQueryClient()
  const parentRef = useRef<HTMLDivElement>(null)
  const lastClickedIndexRef = useRef<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isAnyChecked = selectedEmailIds.size > 0

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

  const handleEmailClick = useCallback(
    (e: React.MouseEvent, email: CachedEmail, index: number) => {
      const isCtrlCmd = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey

      if (isCtrlCmd) {
        // Ctrl/Cmd + click: toggle individual selection
        e.preventDefault() // prevent text selection
        toggleEmailSelection(email.messageId)
        lastClickedIndexRef.current = index
        return
      }

      if (isShift && lastClickedIndexRef.current !== null && emails) {
        // Shift + click: select range
        e.preventDefault() // prevent text selection
        window.getSelection()?.removeAllRanges() // clear any existing selection
        const start = Math.min(lastClickedIndexRef.current, index)
        const end = Math.max(lastClickedIndexRef.current, index)
        const rangeIds = emails.slice(start, end + 1).map((e) => e.messageId)
        selectEmailRange(rangeIds)
        return
      }

      // Normal click: clear multi-select, open email
      if (isAnyChecked) {
        clearSelection()
      }

      lastClickedIndexRef.current = index
      setSelectedEmail(email.messageId, email.folderId)
      if (!email.isRead) {
        markAsReadMutation.mutate(email.messageId)
      }

      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set("email", email.messageId)
      params.set("folder", email.folderId)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [emails, isAnyChecked, searchParams, pathname]
  )

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8ddf0" }}>
          <h2 className="font-semibold" style={{ color: "#2d1a0e" }}>{folderName}</h2>
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#efe6f5" }}>
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
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8ddf0" }}>
          <h2 className="font-semibold" style={{ color: "#2d1a0e" }}>{folderName}</h2>
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className="w-4 h-4" style={{ color: "#7b3e19" }} />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f5e5fc" }}>
            <Inbox className="w-8 h-8" style={{ color: "#b28b84" }} />
          </div>
          <p className="text-sm" style={{ color: "#7b3e19" }}>No emails in {folderName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Bulk action bar */}
      <BulkActionBar />

      {/* Header */}
      {!isAnyChecked && (
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0" style={{ borderColor: "#e8ddf0" }}>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold" style={{ color: "#2d1a0e" }}>
              {folderName}
            </h2>
            <span className="text-xs" style={{ color: "#b28b84" }}>
              {emails.length} emails
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className="w-4 h-4" style={{ color: "#7b3e19" }} />
          </Button>
        </div>
      )}

      {/* Virtualized list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto select-none">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const email = emails[virtualItem.index]
            const isChecked = selectedEmailIds.has(email.messageId)
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
                <EmailContextMenu email={email}>
                  <EmailListItem
                    email={email}
                    isSelected={selectedEmailId === email.messageId}
                    isChecked={isChecked}
                    isAnyChecked={isAnyChecked}
                    onSelect={(e) => handleEmailClick(e, email, virtualItem.index)}
                    onToggleFlag={() =>
                      toggleFlagMutation.mutate({
                        messageId: email.messageId,
                        isFlagged: !email.isFlagged,
                      })
                    }
                    onToggleCheck={() => toggleEmailSelection(email.messageId)}
                  />
                </EmailContextMenu>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
