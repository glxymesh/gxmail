import { NextRequest, NextResponse } from "next/server"
import { getEmailClient } from "@/lib/email-client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string; attachmentId: string }> }
) {
  try {
    const { client } = await getEmailClient()
    const { messageId, attachmentId } = await params
    const folderId = req.nextUrl.searchParams.get("folderId")
    if (!folderId) {
      return NextResponse.json({ error: "folderId required" }, { status: 400 })
    }
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
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 })
  }
}
