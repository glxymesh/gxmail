"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Mail,
  MailOpen,
  Star,
  StarOff,
  Trash2,
  FolderInput,
  Reply,
  ReplyAll,
  Forward,
  Folder,
} from "lucide-react"
import { useFolders } from "@/hooks/use-folders"
import {
  useMarkAsRead,
  useMarkAsUnread,
  useToggleFlag,
  useDeleteMessage,
  useMoveToFolder,
} from "@/hooks/use-mail-actions"
import { useMailStore } from "@/stores/mail-store"
import type { CachedEmail } from "@/hooks/use-emails"

interface EmailContextMenuProps {
  email: CachedEmail
  children: React.ReactNode
}

export function EmailContextMenu({ email, children }: EmailContextMenuProps) {
  const { data: folders } = useFolders()
  const { openCompose } = useMailStore()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const toggleFlagMutation = useToggleFlag()
  const deleteMutation = useDeleteMessage()
  const moveToFolderMutation = useMoveToFolder()

  const trashFolder = folders?.find((f) => f.folderType === "Trash")

  const moveTargets = (folders || []).filter(
    (f) =>
      f.folderId !== email.folderId &&
      f.folderType !== "Outbox" &&
      f.folderType !== "Templates"
  )

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuContent
          className="w-56 rounded-xl"
          style={{
            background: "#ffffff",
            borderColor: "#e8ddf0",
            position: "fixed",
            left: position.x,
            top: position.y,
          }}
          align="start"
          side="bottom"
        >
          {email.isRead ? (
            <DropdownMenuItem
              onClick={() => markAsUnreadMutation.mutate(email.messageId)}
              className="gap-2 cursor-pointer"
              style={{ color: "#2d1a0e" }}
            >
              <Mail className="w-4 h-4" style={{ color: "#7b3e19" }} />
              Mark as unread
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => markAsReadMutation.mutate(email.messageId)}
              className="gap-2 cursor-pointer"
              style={{ color: "#2d1a0e" }}
            >
              <MailOpen className="w-4 h-4" style={{ color: "#7b3e19" }} />
              Mark as read
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() =>
              toggleFlagMutation.mutate({
                messageId: email.messageId,
                isFlagged: !email.isFlagged,
              })
            }
            className="gap-2 cursor-pointer"
            style={{ color: "#2d1a0e" }}
          >
            {email.isFlagged ? (
              <>
                <StarOff className="w-4 h-4" style={{ color: "#7b3e19" }} />
                Remove star
              </>
            ) : (
              <>
                <Star className="w-4 h-4" style={{ color: "#7b3e19" }} />
                Add star
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator style={{ background: "#efe6f5" }} />

          <DropdownMenuItem
            onClick={() => openCompose("reply", email.messageId)}
            className="gap-2 cursor-pointer"
            style={{ color: "#2d1a0e" }}
          >
            <Reply className="w-4 h-4" style={{ color: "#7b3e19" }} />
            Reply
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openCompose("replyAll", email.messageId)}
            className="gap-2 cursor-pointer"
            style={{ color: "#2d1a0e" }}
          >
            <ReplyAll className="w-4 h-4" style={{ color: "#7b3e19" }} />
            Reply all
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openCompose("forward", email.messageId)}
            className="gap-2 cursor-pointer"
            style={{ color: "#2d1a0e" }}
          >
            <Forward className="w-4 h-4" style={{ color: "#7b3e19" }} />
            Forward
          </DropdownMenuItem>

          <DropdownMenuSeparator style={{ background: "#efe6f5" }} />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="gap-2 cursor-pointer"
              style={{ color: "#2d1a0e" }}
            >
              <FolderInput className="w-4 h-4" style={{ color: "#7b3e19" }} />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className="w-48 rounded-lg max-h-64 overflow-y-auto"
              style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
            >
              {moveTargets.map((folder) => (
                <DropdownMenuItem
                  key={folder.folderId}
                  onClick={() =>
                    moveToFolderMutation.mutate({
                      messageId: email.messageId,
                      folderId: folder.folderId,
                    })
                  }
                  className="gap-2 cursor-pointer"
                  style={{ color: "#2d1a0e" }}
                >
                  <Folder className="w-3.5 h-3.5" style={{ color: "#7b3e19" }} />
                  {folder.folderName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator style={{ background: "#efe6f5" }} />

          <DropdownMenuItem
            onClick={() => {
              if (trashFolder) {
                deleteMutation.mutate({
                  messageId: email.messageId,
                  trashFolderId: trashFolder.folderId,
                })
              }
            }}
            className="gap-2 cursor-pointer"
            style={{ color: "#d93025" }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
