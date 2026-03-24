import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { linkedEmailAccounts } from "@/lib/db/schema"
import { ZohoEmailProvider } from "@/lib/linked-accounts/zoho"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL))
  }

  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const location = req.nextUrl.searchParams.get("location")

  if (!code) {
    return NextResponse.redirect(
      new URL("/onboarding?error=no_code", process.env.AUTH_URL)
    )
  }

  // Verify state
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString())
      if (parsed.userId !== session.user.id) {
        return NextResponse.redirect(
          new URL("/onboarding?error=invalid_state", process.env.AUTH_URL)
        )
      }
    } catch {
      // State parsing failed — continue anyway (Zoho might not return our exact state)
    }
  }

  const provider = new ZohoEmailProvider()
  const region = location || process.env.ZOHO_REGION || "in"

  try {
    // Exchange code for tokens
    const tokens = await provider.exchangeCode(code)

    // Fetch Zoho account profile
    const profile = await provider.getProfile(tokens.access_token, region)

    // Check if already linked
    const existing = await db.query.linkedEmailAccounts.findFirst({
      where: and(
        eq(linkedEmailAccounts.userId, session.user.id),
        eq(linkedEmailAccounts.provider, "zoho"),
        eq(linkedEmailAccounts.providerAccountId, profile.accountId)
      ),
    })

    // Check if user has any accounts (first account becomes default)
    const hasAccounts = await db.query.linkedEmailAccounts.findFirst({
      where: eq(linkedEmailAccounts.userId, session.user.id),
      columns: { id: true },
    })

    if (existing) {
      // Update existing linked account tokens
      await db
        .update(linkedEmailAccounts)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existing.refreshToken,
          expiresAt: tokens.expires_in
            ? Math.floor(Date.now() / 1000) + tokens.expires_in
            : existing.expiresAt,
          email: profile.email,
          displayName: profile.displayName,
          region,
          syncedAt: null, // Force re-sync
        })
        .where(eq(linkedEmailAccounts.id, existing.id))
    } else {
      // Create new linked account
      await db.insert(linkedEmailAccounts).values({
        userId: session.user.id,
        provider: "zoho",
        providerAccountId: profile.accountId,
        email: profile.email,
        displayName: profile.displayName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? Math.floor(Date.now() / 1000) + tokens.expires_in
          : null,
        region,
        isDefault: !hasAccounts, // First account is default
      })
    }

    // Set cookie so proxy allows access to /inbox
    const redirectResponse = NextResponse.redirect(new URL("/inbox", process.env.AUTH_URL))
    redirectResponse.cookies.set("gxmail-has-accounts", "1", {
      path: "/",
      maxAge: 86400,
    })
    return redirectResponse
  } catch (error) {
    console.error("Zoho linking error:", error)
    return NextResponse.redirect(
      new URL(`/onboarding?error=linking_failed`, process.env.AUTH_URL)
    )
  }
}
