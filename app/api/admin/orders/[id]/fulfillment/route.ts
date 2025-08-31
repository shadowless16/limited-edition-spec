import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { verifyToken } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectToDatabase()

    const { fulfillmentStatus, trackingNumber, shippingCarrier, estimatedDelivery, fulfillmentNotes } =
      await request.json()

    // `params` may be a Promise in Next.js App Router; await before using
    const { id } = await params as { id: string }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        fulfillmentStatus,
        trackingNumber,
        shippingCarrier,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        fulfillmentNotes,
        ...(fulfillmentStatus === "shipped" && { status: "shipped" }),
        ...(fulfillmentStatus === "delivered" && { status: "delivered" }),
        updatedAt: new Date(),
      },
      { new: true },
    ).populate("userId", "email firstName lastName")

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (trackingNumber && fulfillmentStatus === "shipped") {
      await sendEmail({
        to: order.userId.email,
        subject: `Your order ${order.orderNumber} has shipped!`,
        template: "order-shipped",
        data: {
          orderNumber: order.orderNumber,
          trackingNumber,
          shippingCarrier,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : "TBD",
        },
      })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Error updating fulfillment:", error)
    return NextResponse.json({ error: "Failed to update fulfillment" }, { status: 500 })
  }
}
