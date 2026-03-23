"use client"

import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { searchEmails } from "@/lib/actions/mail"
import { useMailStore } from "@/stores/mail-store"
import { EmailListItem } from "@/components/mail/email-list-item"
import { EmailViewer } from "@/components/mail/email-viewer"
import { useToggleFlag } from "@/hooks/use-mail-actions"
import { Search } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const { selectedEmailId, setSelectedEmail } = useMailStore()
  const toggleFlagMutation = useToggleFlag()

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchEmails(query),
    enabled: !!query,
  })

  const mappedResults =
    results?.map((msg) => ({
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

  return (
    <div className="h-full flex">
      <div
        className={`h-full border-r overflow-hidden ${
          selectedEmailId ? "hidden md:block" : "block"
        }`}
        style={{
          borderColor: "#e8e8e4",
          width: selectedEmailId ? "380px" : "100%",
          minWidth: selectedEmailId ? "380px" : undefined,
        }}
      >
        <div
          className="px-4 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "#e8e8e4" }}
        >
          <Search className="w-4 h-4" style={{ color: "#ad8b63" }} />
          <h2 className="font-semibold text-sm" style={{ color: "#3b2e1f" }}>
            Results for &ldquo;{query}&rdquo;
          </h2>
          {results && (
            <span className="text-xs" style={{ color: "#ad8b63" }}>
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
                style={{ borderColor: "#f1f1ee" }}
              >
                <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded skeleton-shimmer" />
                  <div className="h-3 w-48 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : mappedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Search className="w-12 h-12" style={{ color: "#e8e8e4" }} />
            <p className="text-sm" style={{ color: "#775d3f" }}>
              No results found
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100%-49px)]">
            {mappedResults.map((email) => (
              <EmailListItem
                key={email.messageId}
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
