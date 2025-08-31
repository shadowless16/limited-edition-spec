import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { paymentIntentId, status } = await request.json()

    // `params` may be a Promise in Next.js App Router; await before using
    const { id } = await params as { id: string }

    const order = await Order.findOneAndUpdate(
      { _id: id, userId: user.id },
      {
        paymentStatus: status,
        paymentIntentId,
        status: status === "paid" ? "confirmed" : "pending",
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (status === "paid") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId)
        if (product) {
          const variant = product.variants.id(item.variantId)
          if (variant) {
            variant.stock -= item.quantity
            variant.reserved = Math.max(0, variant.reserved - item.quantity)
            await product.save()
          }
        }
      }
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Error updating payment status:", error)
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
  }
}
