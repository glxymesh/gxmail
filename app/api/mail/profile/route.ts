import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"

export async function GET() {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )

  try {
    const accountsRes = await client.getAccounts()
    const account = accountsRes.data?.[0]

    if (account) {
      return NextResponse.json({
        name: account.displayName || account.accountDisplayName || "",
        email: account.primaryEmailAddress || account.mailboxAddress || "",
        accountId: account.accountId,
        type: account.type,
      })
    }

    return NextResponse.json({
      name: session.user.name || "",
      email: session.user.zohoEmail || session.user.email || "",
    })
  } catch {
    return NextResponse.json({
      name: session.user.name || "",
      email: session.user.zohoEmail || session.user.email || "",
    })
  }
}
