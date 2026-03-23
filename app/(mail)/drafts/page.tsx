"use client"

import { useEffect } from "react"
import { useFolders } from "@/hooks/use-folders"
import { useMailStore } from "@/stores/mail-store"
import { MailContentLayout } from "@/components/mail/mail-layout"

export default function DraftsPage() {
  const { data: folders } = useFolders()
  const { setSelectedFolder, selectedFolderId } = useMailStore()

  const folder = folders?.find((f) => f.folderType === "Drafts")

  useEffect(() => {
    if (folder && selectedFolderId !== folder.folderId) {
      setSelectedFolder(folder.folderId, "Drafts")
    }
  }, [folder?.folderId])

  return (
    <MailContentLayout
      folderId={folder?.folderId ?? null}
      folderName="Drafts"
    />
  )
}
