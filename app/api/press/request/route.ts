import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PressRequest } from "@/models/PressRequest"
import { Product } from "@/models/Product"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const userId = auth.id || auth.userId
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    await connectToDatabase()

    const { productId, variantId, requestType, influencerDetails } = await request.json()

    if (!productId || !requestType) {
      return NextResponse.json({ error: "productId and requestType required" }, { status: 400 })
    }

    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (product.status !== "press") return NextResponse.json({ error: "Product not in Press phase" }, { status: 400 })

    // Check if already requested
    const existing = await PressRequest.findOne({ userId, productId, variantId })
    if (existing) return NextResponse.json({ error: "Already requested this Press Edition" }, { status: 400 })

    // Calculate amount based on request type
    const basePrice = product.basePrice
    const surcharge = product.releasePhases?.press?.surchargePercent || 30
    const amount = requestType === "influencer" ? 0 : Math.round(basePrice * (1 + surcharge / 100))

    const pressRequest = new PressRequest({
      userId,
      productId,
      variantId,
      requestType,
      influencerDetails: requestType === "influencer" ? influencerDetails : undefined,
      amount,
      status: "pending"
    })

    await pressRequest.save()

    return NextResponse.json({ 
      success: true, 
      requestId: pressRequest._id,
      amount,
      message: "Press Edition request submitted for admin approval"
    })

  } catch (error) {
    console.error("Error creating press request:", error)
    return NextResponse.json({ error: "Failed to create press request" }, { status: 500 })
  }
}