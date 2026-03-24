"use client"

import { Star, Paperclip } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import type { CachedEmail } from "@/hooks/use-emails"

interface EmailListItemProps {
  email: CachedEmail
  isSelected: boolean
  isChecked: boolean
  isAnyChecked: boolean
  onSelect: (e: React.MouseEvent) => void
  onToggleFlag: () => void
  onToggleCheck: () => void
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function parseAddress(addr: string | null): { name: string; email: string } {
  if (!addr) return { name: "Unknown", email: "" }
  const decoded = decodeEntities(addr)
  const match = decoded.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/)
  if (match) {
    return {
      name: match[1]?.trim() || match[2]?.trim() || "Unknown",
      email: match[2]?.trim() || decoded,
    }
  }
  return { name: decoded, email: decoded }
}

export function EmailListItem({
  email,
  isSelected,
  isChecked,
  isAnyChecked,
  onSelect,
  onToggleFlag,
  onToggleCheck,
}: EmailListItemProps) {
  const sender = parseAddress(email.fromAddress)
  const isUnread = !email.isRead
  const receivedDate = email.receivedAt
    ? formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })
    : ""

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    onToggleCheck()
  }

  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
      style={{
        background: isChecked
          ? "#ebd4f5"
          : isSelected
            ? "#eef9fd"
            : isUnread
              ? "#eef9fd"
              : "transparent",
        borderColor: "#efe6f5",
        borderLeft: isSelected
          ? "3px solid #7b3e19"
          : isChecked
            ? "3px solid #48b8d0"
            : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isChecked) e.currentTarget.style.background = "#f0dbf8"
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isChecked)
          e.currentTarget.style.background = isUnread ? "#eef9fd" : "transparent"
      }}
    >
      {/* Checkbox area */}
      <div
        className="w-5 shrink-0 flex items-center justify-center"
        onClick={handleCheckboxClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isAnyChecked || isChecked ? (
          <div
            className="w-4 h-4 rounded-sm border flex items-center justify-center cursor-pointer"
            style={{
              borderColor: isChecked ? "#48b8d0" : "#b28b84",
              background: isChecked ? "#48b8d0" : "transparent",
            }}
          >
            {isChecked && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ) : (
          <>
            {/* Unread dot (default) / checkbox on hover */}
            <div className="group-hover:hidden w-2">
              {isUnread && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#48b8d0" }}
                />
              )}
            </div>
            <div
              className="hidden group-hover:flex"
            >
              <div
                className="w-4 h-4 rounded-sm border cursor-pointer"
                style={{ borderColor: "#b28b84" }}
              />
            </div>
          </>
        )}
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFlag()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 cursor-pointer"
      >
        <Star
          className="w-4 h-4"
          style={{
            color: email.isFlagged ? "#48b8d0" : "#e8ddf0",
            fill: email.isFlagged ? "#48b8d0" : "transparent",
          }}
        />
      </button>

      {/* Sender avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
        style={{ background: "#e8ddf0", color: "#2d1a0e" }}
      >
        {sender.name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-sm truncate"
            style={{
              color: "#2d1a0e",
              fontWeight: isUnread ? 600 : 400,
            }}
          >
            {sender.name}
          </span>
          <span
            className="text-xs shrink-0"
            style={{ color: "#b28b84" }}
          >
            {receivedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-sm truncate"
            style={{
              color: isUnread ? "#2d1a0e" : "#7b3e19",
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {decodeEntities(email.subject || "(No subject)")}
          </span>
          {email.hasAttachment && (
            <Paperclip
              className="w-3 h-3 shrink-0"
              style={{ color: "#b28b84" }}
            />
          )}
        </div>
        <p
          className="text-xs truncate mt-0.5"
          style={{ color: "#b28b84" }}
        >
          {decodeEntities(email.snippet || "")}
        </p>
      </div>
    </div>
  )
}
