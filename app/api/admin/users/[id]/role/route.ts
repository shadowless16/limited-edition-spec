import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const admin = await verifyToken(token)
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    await connectToDatabase()

    const body = await request.json()
    const { isAdmin } = body

    if (typeof isAdmin !== "boolean") return NextResponse.json({ error: "isAdmin boolean required" }, { status: 400 })

  // `params` may be a Promise in Next.js App Router; await before using
  const { id } = await params as { id: string }

  const user = await User.findByIdAndUpdate(id, { isAdmin }, { new: true })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
  }
}
