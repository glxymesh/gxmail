"use client"

import { useFolders } from "@/hooks/use-folders"
import { useMailStore } from "@/stores/mail-store"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertTriangle,
  Folder,
  PenSquare,
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"

const FOLDER_ICONS: Record<string, React.ElementType> = {
  Inbox: Inbox,
  Sent: Send,
  Drafts: FileText,
  Trash: Trash2,
  Spam: AlertTriangle,
}

const FOLDER_ORDER = ["Inbox", "Sent", "Drafts", "Trash", "Spam"]

interface SidebarProps {
  mobile?: boolean
}

export function Sidebar({ mobile }: SidebarProps) {
  const { data: folders, isLoading } = useFolders()
  const { selectedFolderId, setSelectedFolder, openCompose } = useMailStore()
  const router = useRouter()

  // Sort folders: system folders first in order, then custom
  const sortedFolders = [...(folders || [])].sort((a, b) => {
    const aIdx = FOLDER_ORDER.indexOf(a.folderType)
    const bIdx = FOLDER_ORDER.indexOf(b.folderType)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return a.folderName.localeCompare(b.folderName)
  })

  const systemFolders = sortedFolders.filter(
    (f) => FOLDER_ORDER.includes(f.folderType)
  )
  const customFolders = sortedFolders.filter(
    (f) => !FOLDER_ORDER.includes(f.folderType)
  )

  function handleFolderClick(folderId: string, folderName: string, folderType: string) {
    setSelectedFolder(folderId, folderName)
    const route = FOLDER_ORDER.includes(folderType)
      ? `/${folderType.toLowerCase()}`
      : `/folder/${folderId}`
    router.push(route)
  }

  return (
    <div
      className="h-full flex flex-col py-3"
      style={{ background: mobile ? "#fae1dd" : "transparent" }}
    >
      {/* Compose button */}
      <div className="px-3 mb-4">
        <Button
          onClick={() => openCompose("new")}
          className="w-full h-10 rounded-xl font-medium gap-2 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #fec89a 0%, #f27202 100%)",
            color: "#ffffff",
            border: "none",
          }}
        >
          <PenSquare className="w-4 h-4" />
          Compose
        </Button>
      </div>

      {/* System folders */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-9 rounded-lg skeleton-shimmer"
              />
            ))}
          </div>
        ) : (
          <>
            {systemFolders.map((folder) => {
              const Icon = FOLDER_ICONS[folder.folderType] || Folder
              const isActive = selectedFolderId === folder.folderId
              return (
                <button
                  key={folder.folderId}
                  onClick={() =>
                    handleFolderClick(
                      folder.folderId,
                      folder.folderName,
                      folder.folderType
                    )
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{
                    background: isActive ? "#ffe5d9" : "transparent",
                    color: isActive ? "#f27202" : "#3b2e1f",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "#fbe6e3"
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent"
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? "#f27202" : "#775d3f" }}
                  />
                  <span className="flex-1 text-left truncate">
                    {folder.folderName}
                  </span>
                  {(folder.unreadCount ?? 0) > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
                      style={{
                        background: "#fff4eb",
                        color: "#f27202",
                      }}
                    >
                      {folder.unreadCount}
                    </Badge>
                  )}
                </button>
              )
            })}

            {customFolders.length > 0 && (
              <>
                <Separator className="my-3" style={{ background: "#fcd5ce" }} />
                <p
                  className="px-3 text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: "#ad8b63" }}
                >
                  Folders
                </p>
                {customFolders.map((folder) => {
                  const isActive = selectedFolderId === folder.folderId
                  return (
                    <button
                      key={folder.folderId}
                      onClick={() =>
                        handleFolderClick(
                          folder.folderId,
                          folder.folderName,
                          folder.folderType
                        )
                      }
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                      style={{
                        background: isActive ? "#ffe5d9" : "transparent",
                        color: isActive ? "#f27202" : "#3b2e1f",
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "#fbe6e3"
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: isActive ? "#f27202" : "#775d3f" }}
                      />
                      <span className="flex-1 text-left truncate">
                        {folder.folderName}
                      </span>
                      {(folder.unreadCount ?? 0) > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
                          style={{
                            background: "#fff4eb",
                            color: "#f27202",
                          }}
                        >
                          {folder.unreadCount}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </>
            )}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 mt-auto pt-3">
        <Separator className="mb-3" style={{ background: "#fcd5ce" }} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          style={{ color: "#775d3f" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fbe6e3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
