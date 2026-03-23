"use client"

import { useQuery } from "@tanstack/react-query"
import { db } from "@/lib/db"

interface CachedFolder {
  id: string
  folderId: string
  folderName: string
  messageCount: number | null
  unreadCount: number | null
  folderType: string
}

export function useFolders() {
  return useQuery<CachedFolder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      const response = await fetch("/api/mail/folders")
      if (!response.ok) throw new Error("Failed to fetch folders")
      return response.json()
    },
    staleTime: 60 * 1000,
  })
}
