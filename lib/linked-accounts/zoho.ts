import type { EmailProvider, TokenSet, EmailAccountProfile } from "./types"
import { getAccountsBaseUrl, getMailBaseUrl, mapLocationToRegion } from "@/lib/zoho/region"
import type { ZohoAccountsResponse } from "@/lib/zoho/types"

const ZOHO_SCOPES = "ZohoMail.accounts.READ ZohoMail.messages.ALL ZohoMail.folders.READ ZohoMail.folders.ALL"

export class ZohoEmailProvider implements EmailProvider {
  id = "zoho" as const
  name = "Zoho Mail"
  icon = "mail"

  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private region: string

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID!
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET!
    this.redirectUri = `${process.env.AUTH_URL}/api/accounts/callback/zoho`
    this.region = process.env.ZOHO_REGION || "in"
  }

  private get baseUrl() {
    return getAccountsBaseUrl(this.region)
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: ZOHO_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    })
    return `${this.baseUrl}/oauth/v2/auth?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const data = await response.json()
    if (data.error) {
      throw new Error(`Zoho token error: ${data.error}`)
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      }),
    })

    const data = await response.json()
    if (data.error) {
      throw new Error(`Zoho refresh error: ${data.error}`)
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    }
  }

  async getProfile(accessToken: string, region?: string): Promise<EmailAccountProfile> {
    const r = region || this.region
    const mailBaseUrl = getMailBaseUrl(r)

    const response = await fetch(`${mailBaseUrl}/api/accounts`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho profile: ${response.status}`)
    }

    const data: ZohoAccountsResponse = await response.json()
    if (!data.data || data.data.length === 0) {
      throw new Error("No Zoho mail accounts found")
    }

    const account = data.data[0]
    return {
      accountId: account.accountId,
      email: account.primaryEmailAddress,
      displayName: account.displayName || account.accountDisplayName || "",
    }
  }
}
