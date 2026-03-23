import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ZohoMailClient } from "@/lib/zoho/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  const session = await auth()
  if (!session?.accessToken || !session.user.zohoAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messageId, attachmentId } = await params
  const folderId = req.nextUrl.searchParams.get("folderId")
  if (!folderId) {
    return NextResponse.json({ error: "folderId required" }, { status: 400 })
  }

  const client = new ZohoMailClient(
    session.accessToken,
    session.user.zohoAccountId,
    session.user.zohoRegion
  )

  try {
    const response = await client.getAttachment(folderId, messageId, attachmentId)
    const blob = await response.blob()

    return new NextResponse(blob, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": response.headers.get("Content-Disposition") || "attachment",
      },
    })
  } catch (error) {
    console.error("Attachment error:", error)
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 }
    )
  }
}
