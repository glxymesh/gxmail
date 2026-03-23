"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMailStore } from "@/stores/mail-store"

export function useSync() {
  const queryClient = useQueryClient()
  const selectedFolderId = useMailStore((s) => s.selectedFolderId)

  return useQuery({
    queryKey: ["sync", selectedFolderId],
    queryFn: async () => {
      const params = selectedFolderId ? `?folderId=${selectedFolderId}` : ""
      const response = await fetch(`/api/mail/sync${params}`)
      if (!response.ok) throw new Error("Sync failed")
      const result = await response.json()

      // Invalidate cached data if new messages arrived
      if (result.newCount > 0 || result.updatedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["emails"] })
        queryClient.invalidateQueries({ queryKey: ["folders"] })
      }

      return result
    },
    refetchInterval: 45 * 1000, // Poll every 45 seconds
    refetchIntervalInBackground: false,
  })
}
