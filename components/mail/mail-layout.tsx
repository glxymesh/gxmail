"use client"

import { useMailStore } from "@/stores/mail-store"
import { EmailList } from "./email-list"
import { EmailViewer } from "./email-viewer"

interface MailLayoutProps {
  folderId: string | null
  folderName: string
}

export function MailContentLayout({ folderId, folderName }: MailLayoutProps) {
  const { selectedEmailId } = useMailStore()

  return (
    <div className="h-full flex">
      {/* Email list — hide on mobile when email selected */}
      <div
        className={`h-full border-r overflow-hidden ${
          selectedEmailId ? "hidden md:block" : "block"
        }`}
        style={{
          borderColor: "#e8e8e4",
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
