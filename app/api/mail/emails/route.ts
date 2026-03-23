import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cachedEmails } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const folderId = req.nextUrl.searchParams.get("folderId")
  if (!folderId) {
    return NextResponse.json({ error: "folderId required" }, { status: 400 })
  }

  const emails = await db.query.cachedEmails.findMany({
    where: and(
      eq(cachedEmails.userId, session.user.id),
      eq(cachedEmails.folderId, folderId)
    ),
    orderBy: [desc(cachedEmails.receivedAt)],
    limit: 200,
  })

  return NextResponse.json(emails)
}
