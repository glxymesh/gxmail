import type { EmailProvider, TokenSet, EmailAccountProfile } from "./types"

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ")

export class GmailEmailProvider implements EmailProvider {
  id = "gmail" as const
  name = "Gmail"
  icon = "mail"

  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.GMAIL_CLIENT_ID!
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET!
    this.redirectUri = `${process.env.AUTH_URL}/api/accounts/callback/gmail`
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: GMAIL_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
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
      throw new Error(`Gmail token error: ${data.error} - ${data.error_description || ""}`)
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenSet> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
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
      throw new Error(`Gmail refresh error: ${data.error} - ${data.error_description || ""}`)
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    }
  }

  async getProfile(accessToken: string): Promise<EmailAccountProfile> {
    // Fetch Gmail profile for email
    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!gmailRes.ok) {
      throw new Error(`Failed to fetch Gmail profile: ${gmailRes.status}`)
    }
    const gmailProfile = await gmailRes.json()

    // Fetch Google userinfo for display name
    const userinfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    let displayName = gmailProfile.emailAddress
    if (userinfoRes.ok) {
      const userinfo = await userinfoRes.json()
      displayName = userinfo.name || userinfo.email || displayName
    }

    return {
      accountId: gmailProfile.emailAddress, // Gmail uses email as account ID
      email: gmailProfile.emailAddress,
      displayName,
    }
  }
}
