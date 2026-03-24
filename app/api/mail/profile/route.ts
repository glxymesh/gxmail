import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDefaultLinkedAccount } from "@/lib/linked-accounts"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const linkedAccount = await getDefaultLinkedAccount(session.user.id)

  return NextResponse.json({
    name: session.user.name || linkedAccount?.displayName || "",
    email: linkedAccount?.email || session.user.email || "",
    provider: linkedAccount?.provider || null,
    linkedAccountId: linkedAccount?.id || null,
  })
}
