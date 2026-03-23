"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useFolders } from "@/hooks/use-folders"
import { useMailStore } from "@/stores/mail-store"
import { MailContentLayout } from "@/components/mail/mail-layout"

export default function CustomFolderPage() {
  const params = useParams()
  const folderId = params.folderId as string
  const { data: folders } = useFolders()
  const { setSelectedFolder, selectedFolderId } = useMailStore()

  const folder = folders?.find((f) => f.folderId === folderId)

  useEffect(() => {
    if (folder && selectedFolderId !== folder.folderId) {
      setSelectedFolder(folder.folderId, folder.folderName)
    }
  }, [folder?.folderId])

  return (
    <MailContentLayout
      folderId={folderId}
      folderName={folder?.folderName ?? "Folder"}
    />
  )
}
