"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MailOpen,
  Mail,
  Star,
  StarOff,
  Trash2,
  FolderInput,
  X,
  Folder,
  CheckSquare,
} from "lucide-react"
import { useMailStore } from "@/stores/mail-store"
import { useFolders } from "@/hooks/use-folders"
import {
  useMarkAsRead,
  useMarkAsUnread,
  useToggleFlag,
  useDeleteMessage,
  useMoveToFolder,
} from "@/hooks/use-mail-actions"

export function BulkActionBar() {
  const { selectedEmailIds, clearSelection } = useMailStore()
  const { data: folders } = useFolders()

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const toggleFlagMutation = useToggleFlag()
  const deleteMutation = useDeleteMessage()
  const moveToFolderMutation = useMoveToFolder()

  const trashFolder = folders?.find((f) => f.folderType === "Trash")
  const count = selectedEmailIds.size

  if (count === 0) return null

  const ids = Array.from(selectedEmailIds)

  function bulkMarkRead() {
    ids.forEach((id) => markAsReadMutation.mutate(id))
    clearSelection()
  }

  function bulkMarkUnread() {
    ids.forEach((id) => markAsUnreadMutation.mutate(id))
    clearSelection()
  }

  function bulkStar() {
    ids.forEach((id) =>
      toggleFlagMutation.mutate({ messageId: id, isFlagged: true })
    )
    clearSelection()
  }

  function bulkUnstar() {
    ids.forEach((id) =>
      toggleFlagMutation.mutate({ messageId: id, isFlagged: false })
    )
    clearSelection()
  }

  function bulkDelete() {
    if (!trashFolder) return
    ids.forEach((id) =>
      deleteMutation.mutate({ messageId: id, trashFolderId: trashFolder.folderId })
    )
    clearSelection()
  }

  function bulkMove(folderId: string) {
    ids.forEach((id) =>
      moveToFolderMutation.mutate({ messageId: id, folderId })
    )
    clearSelection()
  }

  const moveTargets = (folders || []).filter(
    (f) => f.folderType !== "Outbox" && f.folderType !== "Templates"
  )

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
      style={{ background: "#eef9fd", borderColor: "#e8ddf0" }}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4" style={{ color: "#48b8d0" }} />
        <span className="text-sm font-medium" style={{ color: "#2d1a0e" }}>
          {count} selected
        </span>
      </div>

      <div className="w-px h-5" style={{ background: "#e8ddf0" }} />

      {/* Actions */}
      <Button
        variant="ghost"
        size="sm"
        onClick={bulkMarkRead}
        className="gap-1.5 text-xs cursor-pointer"
        style={{ color: "#7b3e19" }}
      >
        <MailOpen className="w-3.5 h-3.5" />
        Read
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={bulkMarkUnread}
        className="gap-1.5 text-xs cursor-pointer"
        style={{ color: "#7b3e19" }}
      >
        <Mail className="w-3.5 h-3.5" />
        Unread
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={bulkStar}
        className="gap-1.5 text-xs cursor-pointer"
        style={{ color: "#7b3e19" }}
      >
        <Star className="w-3.5 h-3.5" />
        Star
      </Button>

      {/* Move to folder */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs cursor-pointer"
            style={{ color: "#7b3e19" }}
          >
            <FolderInput className="w-3.5 h-3.5" />
            Move to
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-48 rounded-lg max-h-64 overflow-y-auto"
          style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
        >
          {moveTargets.map((folder) => (
            <DropdownMenuItem
              key={folder.folderId}
              onClick={() => bulkMove(folder.folderId)}
              className="gap-2 cursor-pointer"
              style={{ color: "#2d1a0e" }}
            >
              <Folder className="w-3.5 h-3.5" style={{ color: "#7b3e19" }} />
              {folder.folderName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={bulkDelete}
        className="gap-1.5 text-xs cursor-pointer"
        style={{ color: "#d93025" }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>

      <div className="flex-1" />

      {/* Clear selection */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={clearSelection}
        className="cursor-pointer"
        style={{ color: "#b28b84" }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
