import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cachedEmails } from "@/lib/db/schema"
import { eq, and, desc, gt } from "drizzle-orm"

/**
 * Local filter API for quick filters on cached emails.
 * Handles filters that Zoho search API doesn't support natively.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const filter = req.nextUrl.searchParams.get("filter") || ""
  const userId = session.user.id

  if (filter === "local:unread") {
    const emails = await db.query.cachedEmails.findMany({
      where: and(eq(cachedEmails.userId, userId), eq(cachedEmails.isRead, false)),
      orderBy: [desc(cachedEmails.receivedAt)],
      limit: 200,
    })
    return NextResponse.json(emails)
  }

  if (filter === "local:starred") {
    const emails = await db.query.cachedEmails.findMany({
      where: and(eq(cachedEmails.userId, userId), eq(cachedEmails.isFlagged, true)),
      orderBy: [desc(cachedEmails.receivedAt)],
      limit: 200,
    })
    return NextResponse.json(emails)
  }

  if (filter === "local:attachment") {
    const emails = await db.query.cachedEmails.findMany({
      where: and(eq(cachedEmails.userId, userId), eq(cachedEmails.hasAttachment, true)),
      orderBy: [desc(cachedEmails.receivedAt)],
      limit: 200,
    })
    return NextResponse.json(emails)
  }

  // local:recent:N — emails from last N days
  if (filter.startsWith("local:recent:")) {
    const days = parseInt(filter.split(":")[2])
    if (!isNaN(days)) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const emails = await db.query.cachedEmails.findMany({
        where: and(eq(cachedEmails.userId, userId), gt(cachedEmails.receivedAt, since)),
        orderBy: [desc(cachedEmails.receivedAt)],
        limit: 200,
      })
      return NextResponse.json(emails)
    }
  }

  return NextResponse.json([])
}
