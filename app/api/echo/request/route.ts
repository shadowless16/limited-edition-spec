import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { EchoRequest } from "@/models/EchoRequest"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { productId, variantId, email, phone, paymentIntentId } = await request.json()

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    // Get product to calculate amount
    const { Product } = await import("@/models/Product")
    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (product.status !== "echo") return NextResponse.json({ error: "Product not in Echo phase" }, { status: 400 })

    let userId: any = null
    if (token) {
      const u = await verifyToken(token)
      if (u) userId = (u as any).id || (u as any).userId
    }

    // Check if already requested
    const existing = await EchoRequest.findOne({ userId, productId, variantId })
    if (existing) return NextResponse.json({ error: "Already requested this Echo" }, { status: 400 })

    // Calculate escrow release date (2 weeks from now)
    const escrowReleaseDate = new Date()
    escrowReleaseDate.setDate(escrowReleaseDate.getDate() + 14)

    const doc = new EchoRequest({ 
      userId, 
      productId, 
      variantId, 
      contactEmail: email, 
      contactPhone: phone,
      amount: product.basePrice,
      paymentStatus: paymentIntentId ? "escrowed" : "pending",
      paymentIntentId: paymentIntentId || null,
      escrowReleaseDate
    })
    await doc.save()

    return NextResponse.json({ ok: true, escrowReleaseDate })
  } catch (err) {
    console.error("Error saving echo request:", err)
    return NextResponse.json({ error: "Failed to request echo" }, { status: 500 })
  }
}
