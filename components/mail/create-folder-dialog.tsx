"use client"

import { useState } from "react"
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
import { FolderPlus } from "lucide-react"
import { createFolder } from "@/lib/actions/folders"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await createFolder(name.trim())
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      toast.success(`Folder "${name.trim()}" created`)
      setName("")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to create folder")
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
              <FolderPlus className="w-4 h-4" style={{ color: "#48b8d0" }} />
            </div>
            New Folder
          </DialogTitle>
          <DialogDescription style={{ color: "#b28b84" }}>
            Create a new folder to organize your emails.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="h-10 rounded-lg"
            style={{ borderColor: "#e8ddf0", color: "#2d1a0e" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate()
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
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="rounded-lg cursor-pointer"
            style={{ background: "#7b3e19", color: "#ffffff" }}
          >
            {loading ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
