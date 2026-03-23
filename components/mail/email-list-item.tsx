"use client"

import { Star, Paperclip } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { CachedEmail } from "@/hooks/use-emails"

interface EmailListItemProps {
  email: CachedEmail
  isSelected: boolean
  onSelect: () => void
  onToggleFlag: () => void
}

function parseAddress(addr: string | null): { name: string; email: string } {
  if (!addr) return { name: "Unknown", email: "" }
  // Handle "Name <email>" format
  const match = addr.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/)
  if (match) {
    return {
      name: match[1]?.trim() || match[2]?.trim() || "Unknown",
      email: match[2]?.trim() || addr,
    }
  }
  return { name: addr, email: addr }
}

export function EmailListItem({
  email,
  isSelected,
  onSelect,
  onToggleFlag,
}: EmailListItemProps) {
  const sender = parseAddress(email.fromAddress)
  const isUnread = !email.isRead
  const receivedDate = email.receivedAt
    ? formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })
    : ""

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
      style={{
        background: isSelected
          ? "#fff4eb"
          : isUnread
            ? "#fff5f1"
            : "transparent",
        borderColor: "#f1f1ee",
        borderLeft: isSelected ? "3px solid #f27202" : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "#faf1f0"
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = isUnread
            ? "#fff5f1"
            : "transparent"
      }}
    >
      {/* Unread dot */}
      <div className="w-2 shrink-0">
        {isUnread && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#ff6f08" }}
          />
        )}
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFlag()
        }}
        className="shrink-0 cursor-pointer"
      >
        <Star
          className="w-4 h-4"
          style={{
            color: email.isFlagged ? "#fd9d49" : "#e8e8e4",
            fill: email.isFlagged ? "#fd9d49" : "transparent",
          }}
        />
      </button>

      {/* Sender avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
        style={{ background: "#fcd5ce", color: "#3b2e1f" }}
      >
        {sender.name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm truncate"
            style={{
              color: "#3b2e1f",
              fontWeight: isUnread ? 600 : 400,
            }}
          >
            {sender.name}
          </span>
          <span
            className="text-xs shrink-0"
            style={{ color: "#ad8b63" }}
          >
            {receivedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-sm truncate"
            style={{
              color: isUnread ? "#3b2e1f" : "#775d3f",
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {email.subject || "(No subject)"}
          </span>
          {email.hasAttachment && (
            <Paperclip
              className="w-3 h-3 shrink-0"
              style={{ color: "#ad8b63" }}
            />
          )}
        </div>
        <p
          className="text-xs truncate mt-0.5"
          style={{ color: "#ad8b63" }}
        >
          {email.snippet}
        </p>
      </div>
    </div>
  )
}
