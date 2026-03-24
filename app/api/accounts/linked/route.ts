import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getLinkedAccounts } from "@/lib/linked-accounts"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await getLinkedAccounts(session.user.id)

  // Don't expose tokens to the client
  const safe = accounts.map((a) => ({
    id: a.id,
    provider: a.provider,
    email: a.email,
    displayName: a.displayName,
    isDefault: a.isDefault,
    linkedAt: a.linkedAt,
  }))

  return NextResponse.json(safe)
}
