import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const { shippingAddress } = await request.json()

    // `params` may be a Promise in Next.js App Router; await before using
    const { id } = await params as { id: string }

    // Token payloads may include either `id` or `userId` depending on signing.
    const authUserId = (user as any).userId || (user as any).id

    const order = await Order.findOneAndUpdate(
      { _id: id, userId: authUserId },
      {
        shippingAddress,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Error updating shipping address:", error)
    return NextResponse.json({ error: "Failed to update shipping address" }, { status: 500 })
  }
}
