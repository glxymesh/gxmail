"use client"

import { useEffect } from "react"
import { useFolders } from "@/hooks/use-folders"
import { useMailStore } from "@/stores/mail-store"
import { MailContentLayout } from "@/components/mail/mail-layout"

export default function InboxPage() {
  const { data: folders } = useFolders()
  const { setSelectedFolder, selectedFolderId } = useMailStore()

  const inboxFolder = folders?.find((f) => f.folderType === "Inbox")

  useEffect(() => {
    if (inboxFolder && selectedFolderId !== inboxFolder.folderId) {
      setSelectedFolder(inboxFolder.folderId, "Inbox")
    }
  }, [inboxFolder?.folderId])

  return (
    <MailContentLayout
      folderId={inboxFolder?.folderId ?? null}
      folderName="Inbox"
    />
  )
}
