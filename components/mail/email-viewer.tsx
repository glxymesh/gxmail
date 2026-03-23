"use client"

import { useEffect, useRef } from "react"
import { useEmailContent } from "@/hooks/use-email"
import { useEmails } from "@/hooks/use-emails"
import { useMailStore } from "@/stores/mail-store"
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
import DOMPurify from "dompurify"

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

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const toggleFlagMutation = useToggleFlag()
  const deleteMutation = useDeleteMessage()

  const email = emails?.find((e) => e.messageId === selectedEmailId)
  const trashFolder = folders?.find((f) => f.folderType === "Trash")

  // Track which emails we've already marked as read to avoid duplicate calls
  const markedReadRef = useRef<Set<string>>(new Set())

  // Auto-mark as read when opening an email
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

  if (!selectedEmailId || !email) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "#f8edeb" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ad8b63"
              strokeWidth="1.5"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "#775d3f" }}>
            Select an email to read
          </p>
          <p className="text-xs" style={{ color: "#ad8b63" }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#f8edeb" }}>c</kbd> to compose
          </p>
        </div>
      </div>
    )
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

  const sender = parseSender(email.fromAddress)
  const sanitizedContent = contentData?.content
    ? DOMPurify.sanitize(contentData.content, {
        ADD_ATTR: ["target"],
        FORBID_TAGS: ["script", "style"],
      })
    : ""

  // Show skeleton while content is loading
  if (contentLoading && !sanitizedContent) {
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
            setSelectedEmail(null)
          }
        }}
        onMarkUnread={() => {
          // Remove from marked-read set so it can be re-marked later
          markedReadRef.current.delete(selectedEmailId!)
          markAsUnreadMutation.mutate(selectedEmailId!)
          setSelectedEmail(null)
        }}
        onToggleFlag={() =>
          toggleFlagMutation.mutate({
            messageId: selectedEmailId!,
            isFlagged: !email.isFlagged,
          })
        }
        onBack={() => setSelectedEmail(null)}
        isFlagged={email.isFlagged ?? false}
      />

      {/* Email header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#f1f1ee" }}>
        <h1
          className="text-xl font-semibold mb-4"
          style={{ color: "#3b2e1f" }}
        >
          {email.subject || "(No subject)"}
        </h1>

        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: "#fcd5ce", color: "#3b2e1f" }}
          >
            {sender.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <span
                  className="font-medium text-sm"
                  style={{ color: "#3b2e1f" }}
                >
                  {sender.name}
                </span>
                <span
                  className="text-xs ml-2"
                  style={{ color: "#ad8b63" }}
                >
                  &lt;{sender.email}&gt;
                </span>
              </div>
              <span className="text-xs shrink-0" style={{ color: "#ad8b63" }}>
                {email.receivedAt
                  ? format(new Date(email.receivedAt), "MMM d, yyyy h:mm a")
                  : ""}
              </span>
            </div>
            {email.toAddress && (
              <p className="text-xs mt-1" style={{ color: "#ad8b63" }}>
                to {formatRecipients(email.toAddress)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div
          className="email-content"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Attachments */}
        {email.hasAttachment && selectedEmailFolderId && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "#f1f1ee" }}>
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
