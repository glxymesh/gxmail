import { create } from "zustand"

interface MailState {
  // Selected folder
  selectedFolderId: string | null
  selectedFolderName: string | null

  // Selected email
  selectedEmailId: string | null
  selectedEmailFolderId: string | null

  // UI state
  sidebarOpen: boolean
  composeOpen: boolean
  composeMode: "new" | "reply" | "replyAll" | "forward"
  replyToMessageId: string | null
  searchQuery: string

  // Actions
  setSelectedFolder: (folderId: string, folderName: string) => void
  setSelectedEmail: (emailId: string | null, folderId?: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openCompose: (mode?: "new" | "reply" | "replyAll" | "forward", replyToId?: string) => void
  closeCompose: () => void
  setSearchQuery: (query: string) => void
}

export const useMailStore = create<MailState>((set) => ({
  selectedFolderId: null,
  selectedFolderName: null,
  selectedEmailId: null,
  selectedEmailFolderId: null,
  sidebarOpen: true,
  composeOpen: false,
  composeMode: "new",
  replyToMessageId: null,
  searchQuery: "",

  setSelectedFolder: (folderId, folderName) =>
    set({
      selectedFolderId: folderId,
      selectedFolderName: folderName,
      selectedEmailId: null,
      selectedEmailFolderId: null,
    }),

  setSelectedEmail: (emailId, folderId) =>
    set({
      selectedEmailId: emailId,
      selectedEmailFolderId: folderId ?? null,
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openCompose: (mode = "new", replyToId) =>
    set({
      composeOpen: true,
      composeMode: mode,
      replyToMessageId: replyToId ?? null,
    }),

  closeCompose: () =>
    set({
      composeOpen: false,
      replyToMessageId: null,
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}))
