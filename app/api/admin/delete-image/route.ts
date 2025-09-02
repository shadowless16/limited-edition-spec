import { type NextRequest, NextResponse } from "next/server"
import { deleteImage } from "@/lib/cloudinary"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const publicId = body?.publicId
    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 })
    }

    await deleteImage(publicId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
