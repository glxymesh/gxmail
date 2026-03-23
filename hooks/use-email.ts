"use client"

import { useQuery } from "@tanstack/react-query"

interface EmailContent {
  content: string
}

export function useEmailContent(messageId: string | null, folderId: string | null) {
  return useQuery<EmailContent>({
    queryKey: ["email-content", messageId],
    queryFn: async () => {
      if (!messageId || !folderId) throw new Error("Missing params")
      const response = await fetch(
        `/api/mail/message/${messageId}?folderId=${folderId}`
      )
      if (!response.ok) throw new Error("Failed to fetch email content")
      return response.json()
    },
    enabled: !!messageId && !!folderId,
    staleTime: 5 * 60 * 1000, // Cache content for 5 minutes
  })
}
