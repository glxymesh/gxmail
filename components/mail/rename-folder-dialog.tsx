"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { renameFolder } from "@/lib/actions/folders"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface RenameFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
  currentName: string
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  folderId,
  currentName,
}: RenameFolderDialogProps) {
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  async function handleRename() {
    if (!name.trim() || name.trim() === currentName) return
    setLoading(true)
    try {
      await renameFolder(folderId, name.trim())
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      toast.success(`Folder renamed to "${name.trim()}"`)
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to rename folder")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[400px] rounded-xl"
        style={{ background: "#ffffff", borderColor: "#e8ddf0" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: "#2d1a0e" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#eef9fd" }}
            >
              <Pencil className="w-4 h-4" style={{ color: "#48b8d0" }} />
            </div>
            Rename Folder
          </DialogTitle>
          <DialogDescription style={{ color: "#b28b84" }}>
            Enter a new name for &ldquo;{currentName}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New folder name"
            className="h-10 rounded-lg"
            style={{ borderColor: "#e8ddf0", color: "#2d1a0e" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
            }}
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg cursor-pointer"
            style={{ borderColor: "#e8ddf0", color: "#7b3e19" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={!name.trim() || name.trim() === currentName || loading}
            className="rounded-lg cursor-pointer"
            style={{ background: "#7b3e19", color: "#ffffff" }}
          >
            {loading ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
