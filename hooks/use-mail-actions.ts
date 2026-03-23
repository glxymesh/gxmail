"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  markAsRead,
  markAsUnread,
  toggleFlag,
  moveToFolder,
  deleteMessage,
  sendEmail,
} from "@/lib/actions/mail"
import type { ComposeMail } from "@/lib/zoho/types"
import type { CachedEmail } from "./use-emails"

/**
 * Helper: optimistically update a single email in all cached query data.
 * Finds the email by messageId across all ["emails", *] queries and applies the updater.
 */
function optimisticUpdateEmail(
  queryClient: ReturnType<typeof useQueryClient>,
  messageId: string,
  updater: (email: CachedEmail) => CachedEmail
) {
  // Update all email list queries (each folder has its own cache key)
  queryClient.setQueriesData<CachedEmail[]>(
    { queryKey: ["emails"] },
    (old) => {
      if (!old) return old
      return old.map((e) => (e.messageId === messageId ? updater(e) : e))
    }
  )
}

/**
 * Helper: optimistically update folder unread counts
 */
function optimisticUpdateFolderCount(
  queryClient: ReturnType<typeof useQueryClient>,
  folderId: string,
  delta: number // +1 or -1
) {
  queryClient.setQueriesData<Array<{ folderId: string; unreadCount: number | null }>>(
    { queryKey: ["folders"] },
    (old) => {
      if (!old) return old
      return old.map((f) =>
        f.folderId === folderId
          ? { ...f, unreadCount: Math.max(0, (f.unreadCount ?? 0) + delta) }
          : f
      )
    }
  )
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => markAsRead(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] })

      const previousEmails = queryClient.getQueriesData<CachedEmail[]>({ queryKey: ["emails"] })

      let folderId: string | null = null
      previousEmails.forEach(([, data]) => {
        const email = data?.find((e) => e.messageId === messageId)
        if (email && !email.isRead) folderId = email.folderId
      })

      optimisticUpdateEmail(queryClient, messageId, (e) => ({ ...e, isRead: true }))
      if (folderId) optimisticUpdateFolderCount(queryClient, folderId, -1)

      return { previousEmails, folderId }
    },
    onError: (_err, _messageId, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => markAsUnread(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] })
      const previousEmails = queryClient.getQueriesData<CachedEmail[]>({ queryKey: ["emails"] })

      let folderId: string | null = null
      previousEmails.forEach(([, data]) => {
        const email = data?.find((e) => e.messageId === messageId)
        if (email && email.isRead) folderId = email.folderId
      })

      optimisticUpdateEmail(queryClient, messageId, (e) => ({ ...e, isRead: false }))
      if (folderId) optimisticUpdateFolderCount(queryClient, folderId, +1)

      return { previousEmails }
    },
    onError: (_err, _messageId, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useToggleFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, isFlagged }: { messageId: string; isFlagged: boolean }) =>
      toggleFlag(messageId, isFlagged),
    onMutate: async ({ messageId, isFlagged }) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] })
      const previousEmails = queryClient.getQueriesData<CachedEmail[]>({ queryKey: ["emails"] })

      optimisticUpdateEmail(queryClient, messageId, (e) => ({ ...e, isFlagged }))

      return { previousEmails }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
  })
}

export function useMoveToFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, folderId }: { messageId: string; folderId: string }) =>
      moveToFolder(messageId, folderId),
    onMutate: async ({ messageId }) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] })
      const previousEmails = queryClient.getQueriesData<CachedEmail[]>({ queryKey: ["emails"] })

      // Remove from current list instantly
      queryClient.setQueriesData<CachedEmail[]>(
        { queryKey: ["emails"] },
        (old) => old?.filter((e) => e.messageId !== messageId) ?? []
      )

      return { previousEmails }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, trashFolderId }: { messageId: string; trashFolderId: string }) =>
      deleteMessage(messageId, trashFolderId),
    onMutate: async ({ messageId }) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] })
      const previousEmails = queryClient.getQueriesData<CachedEmail[]>({ queryKey: ["emails"] })

      // Instantly remove from list
      queryClient.setQueriesData<CachedEmail[]>(
        { queryKey: ["emails"] },
        (old) => old?.filter((e) => e.messageId !== messageId) ?? []
      )

      return { previousEmails }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mail: ComposeMail) => sendEmail(mail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
    },
  })
}
