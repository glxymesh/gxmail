import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GmailEmailProvider } from "@/lib/linked-accounts/gmail"
import crypto from "crypto"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL))
  }

  const provider = new GmailEmailProvider()

  const state = Buffer.from(
    JSON.stringify({
      userId: session.user.id,
      nonce: crypto.randomBytes(16).toString("hex"),
    })
  ).toString("base64url")

  const authUrl = provider.getAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
