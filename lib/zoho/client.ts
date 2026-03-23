import { getMailApiUrl, getMailBaseUrl } from "./region"
import type {
  ZohoAccountsResponse,
  ZohoFoldersResponse,
  ZohoFolder,
  ZohoMessage,
  ZohoMessagesResponse,
  ZohoMessageContentResponse,
  ZohoAttachment,
  ZohoAttachmentInfoResponse,
  ComposeMail,
  ZohoSearchResponse,
} from "./types"

export class ZohoMailClient {
  private baseUrl: string
  private mailBaseUrl: string

  constructor(
    private accessToken: string,
    private accountId: string,
    private region: string
  ) {
    this.baseUrl = getMailApiUrl(region, accountId)
    this.mailBaseUrl = getMailBaseUrl(region)
  }

  private async request<T>(
    path: string,
    opts?: RequestInit & { retries?: number }
  ): Promise<T> {
    const retries = opts?.retries ?? 2
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`

    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url, {
        ...opts,
        headers: {
          Authorization: `Zoho-oauthtoken ${this.accessToken}`,
          "Content-Type": "application/json",
          ...opts?.headers,
        },
      })

      if (response.status === 429 && attempt < retries) {
        // Rate limited — exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 2000)
        )
        continue
      }

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `Zoho API error ${response.status}: ${errorBody}`
        )
      }

      // Parse JSON with large integer protection.
      // Zoho returns IDs as numbers exceeding Number.MAX_SAFE_INTEGER.
      // Use a reviver to convert known ID fields back to their original
      // string representation from the raw text.
      const text = await response.text()

      // First pass: extract all large numbers and their positions
      // by quoting any bare integer >= 16 digits that's a JSON value
      // (preceded by : or , or [ and followed by , or } or ])
      let safe = ""
      let inString = false
      let escape = false
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (escape) {
          safe += ch
          escape = false
          continue
        }
        if (ch === "\\") {
          safe += ch
          escape = true
          continue
        }
        if (ch === '"') {
          inString = !inString
          safe += ch
          continue
        }
        if (!inString && (ch >= "0" && ch <= "9")) {
          // Read the full number
          let num = ch
          let j = i + 1
          while (j < text.length && text[j] >= "0" && text[j] <= "9") {
            num += text[j]
            j++
          }
          if (num.length >= 16) {
            safe += '"' + num + '"'
          } else {
            safe += num
          }
          i = j - 1
          continue
        }
        safe += ch
      }

      return JSON.parse(safe) as T
    }

    throw new Error("Max retries exceeded for Zoho API request")
  }

  // ─── Account ─────────────────────────────────────────────────

  async getAccounts(): Promise<ZohoAccountsResponse> {
    return this.request<ZohoAccountsResponse>(
      `${this.mailBaseUrl}/api/accounts`
    )
  }

  // ─── Folders ─────────────────────────────────────────────────

  async getFolders(): Promise<ZohoFolder[]> {
    const response = await this.request<ZohoFoldersResponse>("/folders")
    return response.data || []
  }

  // ─── Messages ────────────────────────────────────────────────

  async getMessages(
    folderId: string,
    opts?: { start?: number; limit?: number; threadId?: string }
  ): Promise<ZohoMessage[]> {
    const params = new URLSearchParams()
    params.set("folderId", folderId)
    if (opts?.start) params.set("start", String(opts.start))
    if (opts?.limit) params.set("limit", String(opts.limit))
    if (opts?.threadId) params.set("threadId", opts.threadId)
    params.set("includeto", "true")

    const response = await this.request<ZohoMessagesResponse>(
      `/messages/view?${params.toString()}`
    )
    return response.data || []
  }

  async getMessageContent(
    folderId: string,
    messageId: string
  ): Promise<string> {
    const response = await this.request<ZohoMessageContentResponse>(
      `/folders/${folderId}/messages/${messageId}/content`
    )
    return response.data?.content || ""
  }

  async getMessageDetail(
    folderId: string,
    messageId: string
  ) {
    return this.request(
      `/folders/${folderId}/messages/${messageId}/details`
    )
  }

  // ─── Send ────────────────────────────────────────────────────

  async sendEmail(mail: ComposeMail): Promise<void> {
    await this.request("/messages", {
      method: "POST",
      body: JSON.stringify(mail),
    })
  }

  // ─── Update ──────────────────────────────────────────────────

  async updateMessage(
    messageId: string,
    updates: {
      mode?: string
      isRead?: boolean
      isFlagged?: boolean
      destfolderId?: string
    }
  ): Promise<void> {
    let mode = updates.mode || ""

    if (updates.isRead !== undefined) {
      mode = updates.isRead ? "markAsRead" : "markAsUnread"
    }
    if (updates.isFlagged !== undefined) {
      mode = updates.isFlagged ? "flagMails" : "unflagMails"
    }
    if (updates.destfolderId) {
      mode = "move"
    }

    // Zoho updatemessage accepts ONLY mode and msgid (and destfolderId for move)
    const body: Record<string, unknown> = { mode, msgid: [messageId] }
    if (updates.destfolderId) {
      body.destfolderId = updates.destfolderId
    }

    await this.request("/updatemessage", {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  async moveToTrash(messageId: string, trashFolderId: string): Promise<void> {
    await this.updateMessage(messageId, { destfolderId: trashFolderId })
  }

  // ─── Search ──────────────────────────────────────────────────

  async searchMessages(
    query: string,
    opts?: { start?: number; limit?: number }
  ): Promise<ZohoMessage[]> {
    const params = new URLSearchParams()
    params.set("searchKey", query)
    if (opts?.start) params.set("start", String(opts.start))
    if (opts?.limit) params.set("limit", String(opts.limit))
    params.set("includeto", "true")

    const response = await this.request<ZohoSearchResponse>(
      `/messages/search?${params.toString()}`
    )
    return response.data || []
  }

  // ─── Attachments ─────────────────────────────────────────────

  async getAttachmentInfo(
    folderId: string,
    messageId: string
  ): Promise<ZohoAttachment[]> {
    const response = await this.request<ZohoAttachmentInfoResponse>(
      `/folders/${folderId}/messages/${messageId}/attachmentinfo`
    )
    return response.data?.attachments || []
  }

  async getAttachment(
    folderId: string,
    messageId: string,
    attachmentId: string
  ): Promise<Response> {
    const url = `${this.baseUrl}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`
    return fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${this.accessToken}`,
      },
    })
  }
}
