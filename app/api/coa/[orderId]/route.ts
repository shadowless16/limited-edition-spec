import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { COAGenerator } from "@/lib/coa-generator"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const auth = requireAuth(request)
    const userId = auth.id || auth.userId
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const order = await Order.findById(params.orderId)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Only generate COA for paid orders
    if (order.paymentStatus !== "paid") {
      return NextResponse.json({ error: "COA only available for confirmed orders" }, { status: 400 })
    }

    // Generate COA
    const coaData = await COAGenerator.generateCOA(params.orderId)
    const coaPDF = COAGenerator.generateCOAPDF(coaData)

    // Update order with COA info
    if (!order.coaGenerated) {
      order.coaGenerated = true
      order.coaUrl = `/api/coa/${params.orderId}`
      await order.save()
    }

    return new NextResponse(coaPDF, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="COA-${coaData.serialNumber}.txt"`
      }
    })

  } catch (error) {
    console.error("Error generating COA:", error)
    return NextResponse.json({ error: "Failed to generate COA" }, { status: 500 })
  }
}