"use client"

import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { searchEmails } from "@/lib/actions/mail"
import { useMailStore } from "@/stores/mail-store"
import { EmailListItem } from "@/components/mail/email-list-item"
import { EmailViewer } from "@/components/mail/email-viewer"
import { useToggleFlag } from "@/hooks/use-mail-actions"
import { Search, Mail, Star, Paperclip, Clock } from "lucide-react"
import type { CachedEmail } from "@/hooks/use-emails"

// Labels for local filter queries
const LOCAL_FILTER_LABELS: Record<string, { label: string; icon: typeof Mail }> = {
  "local:unread": { label: "Unread emails", icon: Mail },
  "has:flags": { label: "Starred emails", icon: Star },
  "has:attachment": { label: "Emails with attachments", icon: Paperclip },
}

function isLocalFilter(query: string): boolean {
  return query.startsWith("local:")
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const { selectedEmailId, setSelectedEmail } = useMailStore()
  const toggleFlagMutation = useToggleFlag()

  const isLocal = isLocalFilter(query)

  // Zoho search (for non-local queries like has:attachment, has:flags, free text)
  const { data: zohoResults, isLoading: zohoLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchEmails(query),
    enabled: !!query && !isLocal,
  })

  // Local DB filter (for unread, recent etc.)
  const { data: localResults, isLoading: localLoading } = useQuery<CachedEmail[]>({
    queryKey: ["local-filter", query],
    queryFn: async () => {
      const res = await fetch(`/api/mail/filter?filter=${encodeURIComponent(query)}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!query && isLocal,
  })

  const isLoading = isLocal ? localLoading : zohoLoading

  // Map Zoho results to CachedEmail shape
  const mappedZohoResults: CachedEmail[] =
    zohoResults?.map((msg) => ({
      id: msg.messageId,
      messageId: msg.messageId,
      folderId: msg.folderId,
      threadId: msg.threadId || null,
      subject: msg.subject,
      fromAddress: msg.fromAddress,
      toAddress: msg.toAddress,
      ccAddress: msg.ccAddress || null,
      snippet: msg.summary,
      receivedAt: new Date(parseInt(msg.receivedTime)).toISOString(),
      isRead: msg.status === "1",
      isFlagged: msg.flagid !== "0",
      hasAttachment: msg.hasAttachment === "1",
      size: msg.size,
    })) || []

  const results = isLocal ? (localResults || []) : mappedZohoResults

  // Display label
  const filterMeta = LOCAL_FILTER_LABELS[query]
  const displayLabel = filterMeta
    ? filterMeta.label
    : query.startsWith("local:recent:")
      ? `Last ${query.split(":")[2]} days`
      : query

  return (
    <div className="h-full flex">
      <div
        className={`h-full border-r overflow-hidden ${
          selectedEmailId ? "hidden md:block" : "block"
        }`}
        style={{
          borderColor: "#e8ddf0",
          width: selectedEmailId ? "380px" : "100%",
          minWidth: selectedEmailId ? "380px" : undefined,
        }}
      >
        <div
          className="px-4 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "#e8ddf0" }}
        >
          <Search className="w-4 h-4" style={{ color: "#b28b84" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#2d1a0e" }}>
            {displayLabel}
          </h2>
          {results.length > 0 && (
            <span className="text-xs" style={{ color: "#b28b84" }}>
              {results.length} found
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: "#efe6f5" }}
              >
                <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded skeleton-shimmer" />
                  <div className="h-3 w-48 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Search className="w-12 h-12" style={{ color: "#e8ddf0" }} />
            <p className="text-sm" style={{ color: "#7b3e19" }}>
              No results found
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100%-49px)]">
            {results.map((email) => (
              <EmailListItem
                key={email.messageId}
                email={email}
                isSelected={selectedEmailId === email.messageId}
                isChecked={false}
                isAnyChecked={false}
                onSelect={() =>
                  setSelectedEmail(email.messageId, email.folderId)
                }
                onToggleCheck={() => {}}
                onToggleFlag={() =>
                  toggleFlagMutation.mutate({
                    messageId: email.messageId,
                    isFlagged: !email.isFlagged,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {selectedEmailId && (
        <div className="flex-1 h-full overflow-hidden">
          <EmailViewer />
        </div>
      )}
    </div>
  )
}
