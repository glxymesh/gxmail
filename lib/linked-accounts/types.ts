export interface TokenSet {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

export interface EmailAccountProfile {
  accountId: string
  email: string
  displayName: string
}

export interface EmailProvider {
  id: "zoho" | "gmail" | "outlook"
  name: string
  icon: string
  getAuthUrl(state: string): string
  exchangeCode(code: string): Promise<TokenSet>
  refreshToken(refreshToken: string): Promise<TokenSet>
  getProfile(accessToken: string, region?: string): Promise<EmailAccountProfile>
}
