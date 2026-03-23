/**
 * Maps the `location` param from Zoho OAuth callback to the region suffix.
 * Example: "in" → "in", "us" → "com", "eu" → "eu"
 */
const LOCATION_TO_REGION: Record<string, string> = {
  us: "com",
  in: "in",
  eu: "eu",
  au: "com.au",
  jp: "jp",
  ca: "zohocloud.ca",
  sa: "sa",
  cn: "com.cn",
}

export function mapLocationToRegion(location: string | null | undefined): string {
  if (!location) return "com"
  return LOCATION_TO_REGION[location.toLowerCase()] ?? "com"
}

export function getMailBaseUrl(region: string): string {
  return `https://mail.zoho.${region}`
}

export function getAccountsBaseUrl(region: string): string {
  if (region === "zohocloud.ca") {
    return `https://accounts.zohocloud.ca`
  }
  return `https://accounts.zoho.${region}`
}

export function getMailApiUrl(region: string, accountId: string): string {
  return `${getMailBaseUrl(region)}/api/accounts/${accountId}`
}
