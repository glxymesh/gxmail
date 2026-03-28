// ─── Common Mail Client Interface ────────────────────────────────
// Both ZohoMailClient and GmailClient implement this interface,
// allowing sync, actions, and API routes to be provider-agnostic.

export interface NormalizedFolder {
  folderId: string
  folderName: string
  folderPath?: string
  folderType?: string
  messageCount: number
  unReadCount: number
  subFolders?: NormalizedFolder[]
}

export interface NormalizedMessage {
  messageId: string
  folderId: string
  threadId?: string
  subject: string
  sender: string
  senderEmailAddress: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  receivedTime: string // epoch millis as string
  sentDateInGMT?: string
  summary: string
  status: string // "0" = unread, "1" = read
  hasAttachment: string // "0" or "1"
  hasInline?: string
  flagid: string // "0" = unflagged
  priority?: string
  size: number
}

export interface NormalizedAttachment {
  attachmentId: string
  attachmentName: string
  attachmentSize: number
  contentType: string
  isInline: boolean
}

export interface ComposeMailPayload {
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string
  mailFormat?: "html" | "plaintext"
}

export interface MailClient {
  // Folders
  getFolders(): Promise<NormalizedFolder[]>
  createFolder(folderName: string, parentFolderId?: string): Promise<NormalizedFolder>
  renameFolder(folderId: string, folderName: string): Promise<void>
  deleteFolder(folderId: string): Promise<void>

  // Messages
  getMessages(
    folderId: string,
    opts?: { start?: number; limit?: number; threadId?: string }
  ): Promise<NormalizedMessage[]>
  getMessageContent(folderId: string, messageId: string): Promise<string>

  // Send
  sendEmail(mail: ComposeMailPayload): Promise<void>

  // Update
  updateMessage(
    messageId: string,
    updates: {
      mode?: string
      isRead?: boolean
      isFlagged?: boolean
      destfolderId?: string
    }
  ): Promise<void>
  moveToTrash(messageId: string, trashFolderId: string): Promise<void>

  // Search
  searchMessages(
    query: string,
    opts?: { start?: number; limit?: number }
  ): Promise<NormalizedMessage[]>

  // Attachments
  getAttachmentInfo(folderId: string, messageId: string): Promise<NormalizedAttachment[]>
  getAttachment(folderId: string, messageId: string, attachmentId: string): Promise<Response>
}
