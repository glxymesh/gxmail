"use client"

import { useQuery } from "@tanstack/react-query"
import { Paperclip, Download } from "lucide-react"

interface AttachmentChipProps {
  messageId: string
  folderId: string
}

interface AttachmentInfo {
  attachmentId: string
  attachmentName: string
  attachmentSize: number
  contentType: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentChip({ messageId, folderId }: AttachmentChipProps) {
  const { data: attachments } = useQuery<AttachmentInfo[]>({
    queryKey: ["attachments", messageId],
    queryFn: async () => {
      const res = await fetch(
        `/api/mail/attachments?messageId=${messageId}&folderId=${folderId}`
      )
      if (!res.ok) return []
      return res.json()
    },
  })

  if (!attachments || attachments.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#7b3e19" }}>
        <Paperclip className="w-3 h-3" />
        {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <a
            key={att.attachmentId}
            href={`/api/mail/attachment/${messageId}/${att.attachmentId}?folderId=${folderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            style={{
              background: "#f5e5fc",
              color: "#2d1a0e",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0dbf8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f5e5fc")}
          >
            <Download className="w-3 h-3" style={{ color: "#7b3e19" }} />
            <span className="max-w-[200px] truncate">{att.attachmentName}</span>
            <span style={{ color: "#b28b84" }}>{formatSize(att.attachmentSize)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
