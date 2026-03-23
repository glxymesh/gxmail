import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { cachedFolders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const folders = await db.query.cachedFolders.findMany({
    where: eq(cachedFolders.userId, session.user.id),
  })

  return NextResponse.json(folders)
}
