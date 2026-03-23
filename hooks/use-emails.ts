"use client"

import { useQuery } from "@tanstack/react-query"

export interface CachedEmail {
  id: string
  messageId: string
  folderId: string
  threadId: string | null
  subject: string | null
  fromAddress: string | null
  toAddress: string | null
  ccAddress: string | null
  snippet: string | null
  receivedAt: string | null
  isRead: boolean | null
  isFlagged: boolean | null
  hasAttachment: boolean | null
  size: number | null
}

export function useEmails(folderId: string | null) {
  return useQuery<CachedEmail[]>({
    queryKey: ["emails", folderId],
    queryFn: async () => {
      if (!folderId) return []
      const response = await fetch(`/api/mail/emails?folderId=${folderId}`)
      if (!response.ok) throw new Error("Failed to fetch emails")
      return response.json()
    },
    enabled: !!folderId,
    staleTime: 30 * 1000,
  })
}
