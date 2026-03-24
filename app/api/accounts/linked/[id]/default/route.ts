import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { linkedEmailAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  // Unset all defaults for this user
  await db
    .update(linkedEmailAccounts)
    .set({ isDefault: false })
    .where(eq(linkedEmailAccounts.userId, userId))

  // Set the new default
  await db
    .update(linkedEmailAccounts)
    .set({ isDefault: true })
    .where(
      and(
        eq(linkedEmailAccounts.id, id),
        eq(linkedEmailAccounts.userId, userId)
      )
    )

  return NextResponse.json({ success: true })
}
