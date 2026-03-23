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

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => markAsUnread(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useToggleFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, isFlagged }: { messageId: string; isFlagged: boolean }) =>
      toggleFlag(messageId, isFlagged),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] })
    },
  })
}

export function useMoveToFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, folderId }: { messageId: string; folderId: string }) =>
      moveToFolder(messageId, folderId),
    onSuccess: () => {
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
    onSuccess: () => {
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
