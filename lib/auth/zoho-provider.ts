export interface ZohoProfile {
  // Zoho userinfo can return various casings depending on region/version
  ZUID?: string
  Display_Name?: string
  Email?: string
  First_Name?: string
  Last_Name?: string
  // Lowercase variants
  display_name?: string
  email?: string
  first_name?: string
  last_name?: string
  // Some endpoints return these
  displayName?: string
  mailId?: string
  [key: string]: unknown
}

/**
 * Custom Zoho OAuth provider.
 *
 * Zoho's OAuth is region-specific. The authorization starts at accounts.zoho.com
 * but the callback includes `location` and `accounts-server` params indicating
 * the user's actual data center. The token exchange MUST use the regional endpoint.
 *
 * Since Auth.js doesn't natively support dynamic token endpoints based on callback
 * params, we configure the region explicitly. For Indian Zoho accounts, this is `.in`.
 */
export default function ZohoProvider(config: {
  clientId: string
  clientSecret: string
  region?: string // "com" | "in" | "eu" | "com.au" | "jp" etc.
}) {
  const region = config.region || "in"
  const baseUrl = region === "zohocloud.ca"
    ? "https://accounts.zohocloud.ca"
    : `https://accounts.zoho.${region}`

  return {
    id: "zoho",
    name: "Zoho",
    type: "oauth" as const,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    checks: ["state"] as ("state" | "pkce" | "none")[],
    authorization: {
      url: `${baseUrl}/oauth/v2/auth`,
      params: {
        scope: "ZohoMail.accounts.READ ZohoMail.messages.ALL ZohoMail.folders.READ ZohoMail.folders.ALL",
        access_type: "offline",
        prompt: "consent",
      },
    },
    token: `${baseUrl}/oauth/v2/token`,
    userinfo: {
      url: `${baseUrl}/oauth/user/info`,
    },
    profile(profile: ZohoProfile) {
      const id = profile.ZUID || (profile as Record<string, unknown>).ZUID || String(Date.now())
      const name =
        profile.Display_Name ||
        profile.display_name ||
        profile.displayName ||
        [profile.First_Name || profile.first_name, profile.Last_Name || profile.last_name]
          .filter(Boolean)
          .join(" ") ||
        null
      const email =
        profile.Email ||
        profile.email ||
        profile.mailId ||
        null

      return { id: String(id), name, email }
    },
  }
}
