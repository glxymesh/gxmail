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

      return response.json() as Promise<T>
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
    const body: Record<string, unknown> = {
      msgid: [messageId],
    }

    if (updates.isRead !== undefined) {
      body.mode = updates.isRead ? "markAsRead" : "markAsUnread"
    }
    if (updates.isFlagged !== undefined) {
      body.mode = updates.isFlagged ? "flagMails" : "unflagMails"
    }
    if (updates.destfolderId) {
      body.mode = "move"
      body.destfolderId = updates.destfolderId
    }
    if (updates.mode) {
      body.mode = updates.mode
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
