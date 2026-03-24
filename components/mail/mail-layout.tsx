"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useMailStore } from "@/stores/mail-store"
import { EmailList } from "./email-list"
import { EmailViewer } from "./email-viewer"

interface MailLayoutProps {
  folderId: string | null
  folderName: string
}

/**
 * Inner component that reads searchParams (needs Suspense boundary)
 */
function MailContentInner({ folderId, folderName }: MailLayoutProps) {
  const { selectedEmailId, selectedEmailFolderId, setSelectedEmail } = useMailStore()
  const searchParams = useSearchParams()

  // Restore selected email from URL on mount/refresh
  useEffect(() => {
    const emailParam = searchParams.get("email")
    const folderParam = searchParams.get("folder")

    if (emailParam && emailParam !== selectedEmailId) {
      const resolvedFolder = folderParam || folderId
      if (resolvedFolder) {
        setSelectedEmail(emailParam, resolvedFolder)
      }
    }
  }, [searchParams, folderId, selectedEmailId, setSelectedEmail])

  // Also check on folderId change (when folders finish loading)
  useEffect(() => {
    if (!selectedEmailId && folderId) {
      const emailParam = searchParams.get("email")
      const folderParam = searchParams.get("folder")
      if (emailParam) {
        setSelectedEmail(emailParam, folderParam || folderId)
      }
    }
  }, [folderId])

  return (
    <div className="h-full flex">
      {/* Email list — hide on mobile when email selected */}
      <div
        className={`h-full border-r overflow-hidden ${
          selectedEmailId ? "hidden md:block" : "block"
        }`}
        style={{
          borderColor: "#e8ddf0",
          width: selectedEmailId ? "380px" : "100%",
          minWidth: selectedEmailId ? "380px" : undefined,
        }}
      >
        <EmailList folderId={folderId} folderName={folderName} />
      </div>

      {/* Email viewer */}
      {selectedEmailId && (
        <div className="flex-1 h-full overflow-hidden">
          <EmailViewer />
        </div>
      )}
    </div>
  )
}

export function MailContentLayout({ folderId, folderName }: MailLayoutProps) {
  return (
    <Suspense fallback={<div className="h-full skeleton-shimmer" />}>
      <MailContentInner folderId={folderId} folderName={folderName} />
    </Suspense>
  )
}
