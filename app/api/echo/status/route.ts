import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { EchoRequest } from "@/models/EchoRequest"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    // Count escrowed requests
    const escrowedCount = await EchoRequest.countDocuments({
      productId,
      paymentStatus: "escrowed"
    })

    const minRequests = product.releasePhases?.echo?.minRequests || 100
    const windowDays = product.releasePhases?.echo?.windowDays || 14

    // Get earliest escrow date to calculate time remaining
    const earliestRequest = await EchoRequest.findOne({
      productId,
      paymentStatus: "escrowed"
    }).sort({ createdAt: 1 })

    let timeRemaining = null
    if (earliestRequest) {
      const windowEnd = new Date(earliestRequest.createdAt)
      windowEnd.setDate(windowEnd.getDate() + windowDays)
      timeRemaining = Math.max(0, windowEnd.getTime() - Date.now())
    }

    return NextResponse.json({
      productId,
      escrowedCount,
      minRequests,
      thresholdMet: escrowedCount >= minRequests,
      timeRemaining,
      windowDays,
      status: product.status
    })

  } catch (error) {
    console.error("Error getting echo status:", error)
    return NextResponse.json({ error: "Failed to get echo status" }, { status: 500 })
  }
}