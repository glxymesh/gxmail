"use client"

import { useState } from "react"
import { useFolders } from "@/hooks/use-folders"
import { useMailStore } from "@/stores/mail-store"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertTriangle,
  Folder,
  PenSquare,
  LogOut,
  FolderPlus,
  Pencil,
  MoreHorizontal,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateFolderDialog } from "./create-folder-dialog"
import { RenameFolderDialog } from "./rename-folder-dialog"
import { DeleteFolderDialog } from "./delete-folder-dialog"

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

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [targetFolder, setTargetFolder] = useState<{ id: string; name: string } | null>(null)

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
      style={{ background: mobile ? "#f5e5fc" : "transparent" }}
    >
      {/* Compose button */}
      <div className="px-3 mb-4">
        <Button
          onClick={() => openCompose("new")}
          className="w-full h-10 rounded-xl font-medium gap-2 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #8ae1fc 0%, #48b8d0 100%)",
            color: "#ffffff",
            border: "none",
          }}
        >
          <PenSquare className="w-4 h-4" />
          Compose
        </Button>
      </div>

      {/* Folders */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* System folders */}
            {systemFolders.map((folder) => {
              const Icon = FOLDER_ICONS[folder.folderType] || Folder
              const isActive = selectedFolderId === folder.folderId
              return (
                <button
                  key={folder.folderId}
                  onClick={() =>
                    handleFolderClick(folder.folderId, folder.folderName, folder.folderType)
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  style={{
                    background: isActive ? "#ebd4f5" : "transparent",
                    color: isActive ? "#7b3e19" : "#2d1a0e",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#f0dbf8"
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent"
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#7b3e19" }}
                  />
                  <span className="flex-1 text-left truncate">
                    {folder.folderName}
                  </span>
                  {(folder.unreadCount ?? 0) > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
                      style={{ background: "#eef9fd", color: "#7b3e19" }}
                    >
                      {folder.unreadCount}
                    </Badge>
                  )}
                </button>
              )
            })}

            {/* Custom folders section */}
            <Separator className="my-3" style={{ background: "#e8ddf0" }} />
            <div className="flex items-center justify-between px-3 mb-2">
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "#b28b84" }}
              >
                Folders
              </p>
              <button
                onClick={() => setCreateOpen(true)}
                className="p-1 rounded-md transition-colors cursor-pointer"
                style={{ color: "#b28b84" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0dbf8"
                  e.currentTarget.style.color = "#7b3e19"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#b28b84"
                }}
                title="Create new folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {customFolders.length === 0 ? (
              <button
                onClick={() => setCreateOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                style={{ color: "#b28b84" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0dbf8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <FolderPlus className="w-4 h-4 shrink-0" />
                <span className="text-left">Create a folder</span>
              </button>
            ) : (
              customFolders.map((folder) => {
                const isActive = selectedFolderId === folder.folderId
                return (
                  <div
                    key={folder.folderId}
                    className="group flex items-center rounded-lg transition-colors"
                    style={{
                      background: isActive ? "#ebd4f5" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "#f0dbf8"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <button
                      onClick={() =>
                        handleFolderClick(folder.folderId, folder.folderName, folder.folderType)
                      }
                      className="flex-1 flex items-center gap-3 px-3 py-2 text-sm cursor-pointer min-w-0"
                      style={{
                        color: isActive ? "#7b3e19" : "#2d1a0e",
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: "#7b3e19" }}
                      />
                      <span className="flex-1 text-left truncate">
                        {folder.folderName}
                      </span>
                      {(folder.unreadCount ?? 0) > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
                          style={{ background: "#eef9fd", color: "#7b3e19" }}
                        >
                          {folder.unreadCount}
                        </Badge>
                      )}
                    </button>

                    {/* Context menu for custom folders */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1.5 mr-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ color: "#b28b84" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-lg"
                        style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setTargetFolder({ id: folder.folderId, name: folder.folderName })
                            setRenameOpen(true)
                          }}
                          className="gap-2 cursor-pointer text-sm"
                          style={{ color: "#2d1a0e" }}
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: "#7b3e19" }} />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTargetFolder({ id: folder.folderId, name: folder.folderName })
                            setDeleteOpen(true)
                          }}
                          className="gap-2 cursor-pointer text-sm"
                          style={{ color: "#d93025" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })
            )}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 mt-auto pt-3">
        <Separator className="mb-2" style={{ background: "#e8ddf0" }} />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          style={{ color: "#7b3e19" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0dbf8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
      {targetFolder && (
        <>
          <RenameFolderDialog
            open={renameOpen}
            onOpenChange={setRenameOpen}
            folderId={targetFolder.id}
            currentName={targetFolder.name}
          />
          <DeleteFolderDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            folderId={targetFolder.id}
            folderName={targetFolder.name}
          />
        </>
      )}
    </div>
  )
}
