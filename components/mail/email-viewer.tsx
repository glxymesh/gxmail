"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useEmailContent } from "@/hooks/use-email"
import { useEmails } from "@/hooks/use-emails"
import { useMailStore } from "@/stores/mail-store"
import { useRouter, usePathname } from "next/navigation"
import {
  useMarkAsRead,
  useMarkAsUnread,
  useToggleFlag,
  useDeleteMessage,
} from "@/hooks/use-mail-actions"
import { useFolders } from "@/hooks/use-folders"
import { EmailViewerToolbar } from "./email-viewer-toolbar"
import { EmailViewerSkeleton } from "./mail-skeleton"
import { AttachmentChip } from "./attachment-chip"
import { format } from "date-fns"
import { renderEmailHTML } from "@/lib/email-renderer"

export function EmailViewer() {
  const {
    selectedEmailId,
    selectedEmailFolderId,
    setSelectedEmail,
    openCompose,
  } = useMailStore()
  const { data: emails } = useEmails(selectedEmailFolderId)
  const { data: contentData, isLoading: contentLoading } = useEmailContent(
    selectedEmailId,
    selectedEmailFolderId
  )
  const { data: folders } = useFolders()
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = useCallback(() => {
    setSelectedEmail(null)
    router.push(pathname, { scroll: false })
  }, [setSelectedEmail, router, pathname])

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const toggleFlagMutation = useToggleFlag()
  const deleteMutation = useDeleteMessage()

  const email = emails?.find((e) => e.messageId === selectedEmailId)
  const trashFolder = folders?.find((f) => f.folderType === "Trash")

  const markedReadRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (
      selectedEmailId &&
      email &&
      !email.isRead &&
      !markedReadRef.current.has(selectedEmailId) &&
      !markAsReadMutation.isPending
    ) {
      markedReadRef.current.add(selectedEmailId)
      markAsReadMutation.mutate(selectedEmailId)
    }
  }, [selectedEmailId, email?.isRead])

  // Gmail-style: render email HTML with scoped CSS
  const rendered = useMemo(() => {
    if (!contentData?.content) return null
    return renderEmailHTML(contentData.content)
  }, [contentData?.content])

  // No email selected at all
  if (!selectedEmailId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "#f5e5fc" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b28b84"
              strokeWidth="1.5"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "#7b3e19" }}>
            Select an email to read
          </p>
          <p className="text-xs" style={{ color: "#b28b84" }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#f5e5fc" }}>c</kbd> to compose
          </p>
        </div>
      </div>
    )
  }

  // Email selected but data still loading (e.g. page refresh)
  if (!email && !rendered) {
    return <EmailViewerSkeleton />
  }

  function decodeHtmlEntities(str: string): string {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }

  function parseSender(addr: string | null) {
    if (!addr) return { name: "Unknown", email: "" }
    const decoded = decodeHtmlEntities(addr)
    const match = decoded.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/)
    if (match) return { name: match[1]?.trim() || match[2], email: match[2]?.trim() || decoded }
    return { name: decoded, email: decoded }
  }

  function formatRecipients(addr: string | null): string {
    if (!addr) return ""
    return decodeHtmlEntities(addr)
  }

  const sender = parseSender(email?.fromAddress ?? null)

  if (contentLoading && !rendered) {
    return <EmailViewerSkeleton />
  }

  return (
    <div className="h-full flex flex-col">
      <EmailViewerToolbar
        onReply={() => openCompose("reply", selectedEmailId!)}
        onReplyAll={() => openCompose("replyAll", selectedEmailId!)}
        onForward={() => openCompose("forward", selectedEmailId!)}
        onDelete={() => {
          if (trashFolder) {
            deleteMutation.mutate({
              messageId: selectedEmailId!,
              trashFolderId: trashFolder.folderId,
            })
            handleBack()
          }
        }}
        onMarkUnread={() => {
          markedReadRef.current.delete(selectedEmailId!)
          markAsUnreadMutation.mutate(selectedEmailId!)
          handleBack()
        }}
        onToggleFlag={() =>
          toggleFlagMutation.mutate({
            messageId: selectedEmailId!,
            isFlagged: !(email?.isFlagged),
          })
        }
        onBack={handleBack}
        isFlagged={email?.isFlagged ?? false}
      />

      {/* Email header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#efe6f5" }}>
        <h1
          className="text-xl font-semibold mb-4"
          style={{ color: "#2d1a0e" }}
        >
          {decodeHtmlEntities(email?.subject || "(No subject)")}
        </h1>

        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: "#e8ddf0", color: "#2d1a0e" }}
          >
            {sender.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <span
                  className="font-medium text-sm"
                  style={{ color: "#2d1a0e" }}
                >
                  {sender.name}
                </span>
                <span
                  className="text-xs ml-2"
                  style={{ color: "#b28b84" }}
                >
                  &lt;{sender.email}&gt;
                </span>
              </div>
              <span className="text-xs shrink-0" style={{ color: "#b28b84" }}>
                {email?.receivedAt
                  ? format(new Date(email.receivedAt), "MMM d, yyyy h:mm a")
                  : ""}
              </span>
            </div>
            {email?.toAddress && (
              <p className="text-xs mt-1" style={{ color: "#b28b84" }}>
                to {formatRecipients(email.toAddress)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Email body — Gmail-style scoped div rendering */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {rendered ? (
          <>
            {/* Scoped CSS injected via <style> — prefixed so it can't leak */}
            <style dangerouslySetInnerHTML={{ __html: rendered.css }} />
            {/* Email content in a scoped div (like Gmail's .a3s class) */}
            <div
              className={rendered.scopeId}
              dangerouslySetInnerHTML={{ __html: rendered.html }}
            />
          </>
        ) : (
          <p className="text-sm" style={{ color: "#b28b84" }}>
            {email?.snippet || "No content"}
          </p>
        )}

        {/* Attachments */}
        {email?.hasAttachment && selectedEmailFolderId && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "#efe6f5" }}>
            <AttachmentChip
              messageId={selectedEmailId!}
              folderId={selectedEmailFolderId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
