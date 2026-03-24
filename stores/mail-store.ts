import { create } from "zustand"

interface MailState {
  // Selected folder
  selectedFolderId: string | null
  selectedFolderName: string | null

  // Selected email (single)
  selectedEmailId: string | null
  selectedEmailFolderId: string | null

  // Multi-select
  selectedEmailIds: Set<string>
  lastSelectedIndex: number | null

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

  // Multi-select actions
  toggleEmailSelection: (emailId: string) => void
  selectEmailRange: (emailIds: string[]) => void
  clearSelection: () => void
  selectAll: (emailIds: string[]) => void
  isMultiSelectActive: () => boolean
}

export const useMailStore = create<MailState>((set, get) => ({
  selectedFolderId: null,
  selectedFolderName: null,
  selectedEmailId: null,
  selectedEmailFolderId: null,
  selectedEmailIds: new Set(),
  lastSelectedIndex: null,
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
      selectedEmailIds: new Set(),
      lastSelectedIndex: null,
    }),

  setSelectedEmail: (emailId, folderId) =>
    set({
      selectedEmailId: emailId,
      selectedEmailFolderId: folderId ?? null,
      selectedEmailIds: new Set(),
      lastSelectedIndex: null,
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

  // Multi-select: Ctrl/Cmd + click
  toggleEmailSelection: (emailId) =>
    set((state) => {
      const newSet = new Set(state.selectedEmailIds)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return {
        selectedEmailIds: newSet,
        selectedEmailId: null, // clear single select when multi-selecting
      }
    }),

  // Shift + click: select range
  selectEmailRange: (emailIds) =>
    set({
      selectedEmailIds: new Set(emailIds),
      selectedEmailId: null,
    }),

  clearSelection: () =>
    set({
      selectedEmailIds: new Set(),
      lastSelectedIndex: null,
    }),

  selectAll: (emailIds) =>
    set({
      selectedEmailIds: new Set(emailIds),
      selectedEmailId: null,
    }),

  isMultiSelectActive: () => get().selectedEmailIds.size > 0,
}))
