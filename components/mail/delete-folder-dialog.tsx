"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteFolder } from "@/lib/actions/folders"
import { useQueryClient } from "@tanstack/react-query"
import { useMailStore } from "@/stores/mail-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
  folderName: string
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
}: DeleteFolderDialogProps) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { selectedFolderId, setSelectedFolder } = useMailStore()
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteFolder(folderId)
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["emails"] })
      toast.success(`Folder "${folderName}" deleted`)

      // If the deleted folder was selected, navigate to inbox
      if (selectedFolderId === folderId) {
        router.push("/inbox")
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to delete folder")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="rounded-xl"
        style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2" style={{ color: "#2d1a0e" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#fef2f1" }}
            >
              <Trash2 className="w-4 h-4" style={{ color: "#d93025" }} />
            </div>
            Delete Folder
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "#b28b84" }}>
            Are you sure you want to delete &ldquo;{folderName}&rdquo;? This will permanently
            delete the folder and all emails inside it. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            className="rounded-lg cursor-pointer"
            style={{ borderColor: "#e8ddf0", color: "#7b3e19" }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg cursor-pointer"
            style={{ background: "#d93025", color: "#ffffff" }}
          >
            {loading ? "Deleting..." : "Delete Folder"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
