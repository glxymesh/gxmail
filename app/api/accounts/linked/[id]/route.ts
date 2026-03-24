import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { unlinkAccount } from "@/lib/linked-accounts"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await unlinkAccount(session.user.id, id)

  return NextResponse.json({ success: true })
}
