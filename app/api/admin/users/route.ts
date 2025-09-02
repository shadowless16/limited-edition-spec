import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const admin = await verifyToken(token)
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 })

    await connectToDatabase()

    const users = await User.find({}, { password: 0 }).lean().exec()

    // Return minimal public fields
    const result = users.map((u: any) => ({ id: u._id, email: u.email, name: u.name, isAdmin: !!u.isAdmin }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
