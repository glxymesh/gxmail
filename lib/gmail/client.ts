import type {
  GmailLabel,
  GmailLabelsResponse,
  GmailMessage,
  GmailMessageListResponse,
  GmailMessagePart,
  GmailAttachmentResponse,
} from "./types"
import type {
  MailClient,
  NormalizedFolder,
  NormalizedMessage,
  NormalizedAttachment,
  ComposeMailPayload,
} from "@/lib/mail-client"

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"

// Map Gmail system label IDs to our folder type names
const LABEL_TO_FOLDER_TYPE: Record<string, string> = {
  INBOX: "Inbox",
  SENT: "Sent",
  DRAFT: "Drafts",
  TRASH: "Trash",
  SPAM: "Spam",
  STARRED: "Starred",
  IMPORTANT: "Important",
}

// Labels to expose as folders (skip internal ones like CATEGORY_*, UNREAD, etc.)
const VISIBLE_SYSTEM_LABELS = new Set([
  "INBOX", "SENT", "DRAFT", "TRASH", "SPAM", "STARRED", "IMPORTANT",
])

export class GmailClient implements MailClient {
  constructor(private accessToken: string) {}

  private async request<T>(
    path: string,
    opts?: RequestInit & { retries?: number }
  ): Promise<T> {
    const retries = opts?.retries ?? 2
    const url = path.startsWith("http") ? path : `${GMAIL_API}${path}`

    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, {
        ...opts,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...opts?.headers,
        },
      })

      if (response.status === 429 && attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 2000)
        )
        continue
      }

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Gmail API error ${response.status}: ${errorBody}`)
      }

      return response.json() as Promise<T>
    }

    throw new Error("Max retries exceeded for Gmail API request")
  }

  // ─── Folders (Labels) ──────────────────────────────────────────

  async getFolders(): Promise<NormalizedFolder[]> {
    const response = await this.request<GmailLabelsResponse>("/labels")
    const labels = response.labels || []

    // Fetch detailed info (counts) for visible labels
    const visibleLabels = labels.filter(
      (l) =>
        (l.type === "system" && VISIBLE_SYSTEM_LABELS.has(l.id)) ||
        l.type === "user"
    )

    const detailed = await Promise.all(
      visibleLabels.map((l) =>
        this.request<GmailLabel>(`/labels/${encodeURIComponent(l.id)}`)
      )
    )

    return detailed.map((label) => ({
      folderId: label.id,
      folderName: LABEL_TO_FOLDER_TYPE[label.id] || label.name,
      folderPath: label.name,
      folderType: LABEL_TO_FOLDER_TYPE[label.id] || "custom",
      messageCount: label.messagesTotal ?? 0,
      unReadCount: label.messagesUnread ?? 0,
    }))
  }

  async createFolder(
    folderName: string,
    _parentFolderId?: string
  ): Promise<NormalizedFolder> {
    const label = await this.request<GmailLabel>("/labels", {
      method: "POST",
      body: JSON.stringify({
        name: folderName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    })
    return {
      folderId: label.id,
      folderName: label.name,
      folderPath: label.name,
      folderType: "custom",
      messageCount: 0,
      unReadCount: 0,
    }
  }

  async renameFolder(folderId: string, folderName: string): Promise<void> {
    await this.request(`/labels/${encodeURIComponent(folderId)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: folderName }),
    })
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.request(`/labels/${encodeURIComponent(folderId)}`, {
      method: "DELETE",
    })
  }

  // ─── Messages ──────────────────────────────────────────────────

  async getMessages(
    folderId: string,
    opts?: { start?: number; limit?: number; threadId?: string }
  ): Promise<NormalizedMessage[]> {
    const limit = opts?.limit ?? 50
    const params = new URLSearchParams()
    params.set("labelIds", folderId)
    params.set("maxResults", String(limit))

    if (opts?.threadId) {
      // For thread view, use threads endpoint concept — filter by query
      params.delete("labelIds")
      params.set("q", `rfc822msgid:${opts.threadId}`)
    }

    const list = await this.request<GmailMessageListResponse>(
      `/messages?${params.toString()}`
    )

    if (!list.messages || list.messages.length === 0) return []

    // Fetch full metadata for each message (in parallel, batched)
    const messages = await Promise.all(
      list.messages.map((m) =>
        this.request<GmailMessage>(
          `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`
        )
      )
    )

    return messages.map((msg) => this.normalizeMessage(msg, folderId))
  }

  async getMessageContent(
    _folderId: string,
    messageId: string
  ): Promise<string> {
    const msg = await this.request<GmailMessage>(
      `/messages/${messageId}?format=full`
    )
    return this.extractHtmlContent(msg.payload) || this.extractTextContent(msg.payload) || ""
  }

  // ─── Send ──────────────────────────────────────────────────────

  async sendEmail(mail: ComposeMailPayload): Promise<void> {
    const rawEmail = this.buildRawEmail(mail)
    await this.request("/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: rawEmail }),
    })
  }

  // ─── Update ────────────────────────────────────────────────────

  async updateMessage(
    messageId: string,
    updates: {
      mode?: string
      isRead?: boolean
      isFlagged?: boolean
      destfolderId?: string
    }
  ): Promise<void> {
    const addLabelIds: string[] = []
    const removeLabelIds: string[] = []

    if (updates.isRead === true) {
      removeLabelIds.push("UNREAD")
    } else if (updates.isRead === false) {
      addLabelIds.push("UNREAD")
    }

    if (updates.isFlagged === true) {
      addLabelIds.push("STARRED")
    } else if (updates.isFlagged === false) {
      removeLabelIds.push("STARRED")
    }

    if (updates.destfolderId) {
      addLabelIds.push(updates.destfolderId)
      // We don't know the source label here, Gmail handles it via modify
    }

    if (addLabelIds.length > 0 || removeLabelIds.length > 0) {
      await this.request(`/messages/${messageId}/modify`, {
        method: "POST",
        body: JSON.stringify({ addLabelIds, removeLabelIds }),
      })
    }
  }

  async moveToTrash(messageId: string, _trashFolderId: string): Promise<void> {
    await this.request(`/messages/${messageId}/trash`, {
      method: "POST",
    })
  }

  // ─── Search ────────────────────────────────────────────────────

  async searchMessages(
    query: string,
    opts?: { start?: number; limit?: number }
  ): Promise<NormalizedMessage[]> {
    const limit = opts?.limit ?? 50
    const params = new URLSearchParams()
    params.set("q", query)
    params.set("maxResults", String(limit))

    const list = await this.request<GmailMessageListResponse>(
      `/messages?${params.toString()}`
    )

    if (!list.messages || list.messages.length === 0) return []

    const messages = await Promise.all(
      list.messages.map((m) =>
        this.request<GmailMessage>(
          `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`
        )
      )
    )

    return messages.map((msg) => this.normalizeMessage(msg, ""))
  }

  // ─── Attachments ───────────────────────────────────────────────

  async getAttachmentInfo(
    _folderId: string,
    messageId: string
  ): Promise<NormalizedAttachment[]> {
    const msg = await this.request<GmailMessage>(
      `/messages/${messageId}?format=full`
    )
    return this.extractAttachments(msg.payload)
  }

  async getAttachment(
    _folderId: string,
    messageId: string,
    attachmentId: string
  ): Promise<Response> {
    const data = await this.request<GmailAttachmentResponse>(
      `/messages/${messageId}/attachments/${attachmentId}`
    )
    // Convert base64url to binary
    const binary = Buffer.from(data.data, "base64url")
    return new Response(binary, {
      headers: { "Content-Type": "application/octet-stream" },
    })
  }

  // ─── Private Helpers ───────────────────────────────────────────

  private normalizeMessage(
    msg: GmailMessage,
    folderId: string
  ): NormalizedMessage {
    const headers = msg.payload?.headers || []
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ""

    const from = getHeader("From")
    const fromEmail = this.extractEmail(from)
    const fromName = this.extractName(from)

    const isUnread = msg.labelIds?.includes("UNREAD") ?? false
    const isStarred = msg.labelIds?.includes("STARRED") ?? false
    const hasAttachment = this.hasAttachmentParts(msg.payload)

    // Determine folder from labels if not provided
    const effectiveFolderId =
      folderId ||
      msg.labelIds?.find((l) => VISIBLE_SYSTEM_LABELS.has(l)) ||
      msg.labelIds?.[0] ||
      ""

    return {
      messageId: msg.id,
      folderId: effectiveFolderId,
      threadId: msg.threadId,
      subject: getHeader("Subject") || "(no subject)",
      sender: fromName || fromEmail,
      senderEmailAddress: fromEmail,
      fromAddress: from,
      toAddress: getHeader("To"),
      ccAddress: getHeader("Cc") || undefined,
      receivedTime: msg.internalDate,
      sentDateInGMT: getHeader("Date"),
      summary: msg.snippet || "",
      status: isUnread ? "0" : "1",
      hasAttachment: hasAttachment ? "1" : "0",
      hasInline: "0",
      flagid: isStarred ? "1" : "0",
      priority: "0",
      size: msg.sizeEstimate || 0,
    }
  }

  private extractEmail(from: string): string {
    const match = from.match(/<([^>]+)>/)
    return match ? match[1] : from.trim()
  }

  private extractName(from: string): string {
    const match = from.match(/^"?([^"<]*)"?\s*</)
    return match ? match[1].trim() : ""
  }

  private extractHtmlContent(part: GmailMessagePart): string | null {
    if (part.mimeType === "text/html" && part.body?.data) {
      return Buffer.from(part.body.data, "base64url").toString("utf-8")
    }
    if (part.parts) {
      for (const sub of part.parts) {
        const html = this.extractHtmlContent(sub)
        if (html) return html
      }
    }
    return null
  }

  private extractTextContent(part: GmailMessagePart): string | null {
    if (part.mimeType === "text/plain" && part.body?.data) {
      const text = Buffer.from(part.body.data, "base64url").toString("utf-8")
      return `<pre style="white-space: pre-wrap;">${text}</pre>`
    }
    if (part.parts) {
      for (const sub of part.parts) {
        const text = this.extractTextContent(sub)
        if (text) return text
      }
    }
    return null
  }

  private hasAttachmentParts(part: GmailMessagePart): boolean {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      return true
    }
    if (part.parts) {
      return part.parts.some((sub) => this.hasAttachmentParts(sub))
    }
    return false
  }

  private extractAttachments(
    part: GmailMessagePart,
    result: NormalizedAttachment[] = []
  ): NormalizedAttachment[] {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      const contentType =
        part.headers?.find((h) => h.name.toLowerCase() === "content-type")?.value ||
        part.mimeType ||
        "application/octet-stream"
      result.push({
        attachmentId: part.body.attachmentId,
        attachmentName: part.filename,
        attachmentSize: part.body.size || 0,
        contentType: contentType.split(";")[0].trim(),
        isInline: part.headers?.some(
          (h) =>
            h.name.toLowerCase() === "content-disposition" &&
            h.value.toLowerCase().includes("inline")
        ) ?? false,
      })
    }
    if (part.parts) {
      for (const sub of part.parts) {
        this.extractAttachments(sub, result)
      }
    }
    return result
  }

  private buildRawEmail(mail: ComposeMailPayload): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const lines = [
      `From: ${mail.fromAddress}`,
      `To: ${mail.toAddress}`,
      ...(mail.ccAddress ? [`Cc: ${mail.ccAddress}`] : []),
      ...(mail.bccAddress ? [`Bcc: ${mail.bccAddress}`] : []),
      `Subject: ${mail.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: ${mail.mailFormat === "plaintext" ? "text/plain" : "text/html"}; charset="UTF-8"`,
      "",
      mail.content,
    ]
    const raw = lines.join("\r\n")
    return Buffer.from(raw).toString("base64url")
  }
}
