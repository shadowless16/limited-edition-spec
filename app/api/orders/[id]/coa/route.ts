import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { COAGenerator } from "@/lib/coa-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

  // `params` may be a Promise in Next.js App Router; await before using
  const { id } = await params as { id: string }

  const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if user owns this order or is admin
    if (order.userId.toString() !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only generate COA for completed orders
    if (order.status !== "completed") {
      return NextResponse.json({ error: "Order not completed" }, { status: 400 })
    }

  const coaData = await COAGenerator.generateCOA(id)
    const coaPDF = COAGenerator.generateCOAPDF(coaData)

    return NextResponse.json({
      coa: coaData,
      pdf: coaPDF,
    })
  } catch (error) {
    console.error("COA generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
