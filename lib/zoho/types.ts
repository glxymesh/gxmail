// ─── Account ─────────────────────────────────────────────────────

export interface ZohoAccount {
  accountId: string
  displayName: string
  mailboxAddress: string
  accountDisplayName: string
  type: string
  planType: number
  role: string
  country: string
  URI: string
  primaryEmailAddress: string
  enabled: boolean
  incomingBlocked: boolean
  sendMailEnabled: boolean
  popAccessEnabled: boolean
  imapAccessEnabled: boolean
  lastLogin: number
}

export interface ZohoAccountsResponse {
  status: { code: number; description: string }
  data: ZohoAccount[]
}

// ─── Folder ──────────────────────────────────────────────────────

export interface ZohoFolder {
  folderId: string
  folderName: string
  folderPath: string
  folderType: string
  messageCount: number
  unReadCount: number
  subFolders?: ZohoFolder[]
}

export interface ZohoFoldersResponse {
  status: { code: number; description: string }
  data: ZohoFolder[]
}

// ─── Message ─────────────────────────────────────────────────────

export interface ZohoEmailAddress {
  address: string
  name?: string
}

export interface ZohoMessage {
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
  sentDateInGMT: string
  calendarType: number
  summary: string
  status: string // "0" = unread, "1" = read
  hasAttachment: string // "0" or "1"
  hasInline: string
  flagid: string // "0" = unflagged
  priority: string
  size: number
}

export interface ZohoMessagesResponse {
  status: { code: number; description: string }
  data: ZohoMessage[]
}

// ─── Message Detail ──────────────────────────────────────────────

export interface ZohoMessageDetail {
  messageId: string
  folderId: string
  subject: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  sender: string
  receivedTime: string
  sentDateInGMT: string
  content: string // HTML body
  status: string
  hasAttachment: string
  priority: string
  size: number
}

export interface ZohoMessageDetailResponse {
  status: { code: number; description: string }
  data: ZohoMessageDetail
}

// ─── Message Content ─────────────────────────────────────────────

export interface ZohoMessageContentResponse {
  status: { code: number; description: string }
  data: {
    content: string
  }
}

// ─── Attachment ──────────────────────────────────────────────────

export interface ZohoAttachment {
  attachmentId: string
  attachmentName: string
  attachmentSize: number
  contentType: string
  isInline: boolean
}

export interface ZohoAttachmentInfoResponse {
  status: { code: number; description: string }
  data: {
    attachments: ZohoAttachment[]
  }
}

// ─── Send Mail ───────────────────────────────────────────────────

export interface ComposeMail {
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string
  askReceipt?: string
  mailFormat?: "html" | "plaintext"
}

// ─── Search ──────────────────────────────────────────────────────

export interface ZohoSearchResponse {
  status: { code: number; description: string }
  data: ZohoMessage[]
}

// ─── API Error ───────────────────────────────────────────────────

export interface ZohoApiError {
  status: {
    code: number
    description: string
  }
  data: {
    errorCode: string
    moreInfo: string
  }
}
