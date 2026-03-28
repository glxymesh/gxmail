// ─── Gmail API Types ─────────────────────────────────────────────

export interface GmailLabel {
  id: string
  name: string
  type: "system" | "user"
  messageListVisibility?: "show" | "hide"
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide"
  messagesTotal?: number
  messagesUnread?: number
  threadsTotal?: number
  threadsUnread?: number
}

export interface GmailLabelsResponse {
  labels: GmailLabel[]
}

export interface GmailMessageHeader {
  name: string
  value: string
}

export interface GmailMessagePart {
  partId: string
  mimeType: string
  filename: string
  headers: GmailMessageHeader[]
  body: {
    attachmentId?: string
    size: number
    data?: string // base64url encoded
  }
  parts?: GmailMessagePart[]
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  historyId: string
  internalDate: string // epoch millis
  payload: GmailMessagePart
  sizeEstimate: number
}

export interface GmailMessageListResponse {
  messages?: { id: string; threadId: string }[]
  nextPageToken?: string
  resultSizeEstimate?: number
}

export interface GmailAttachmentResponse {
  attachmentId: string
  size: number
  data: string // base64url encoded
}

export interface GmailProfile {
  emailAddress: string
  messagesTotal: number
  threadsTotal: number
  historyId: string
}
