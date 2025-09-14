import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { EchoRequest } from "@/models/EchoRequest"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { productId, variantId, email, phone } = await request.json()

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

    let userId: any = null
    if (token) {
      const u = await verifyToken(token)
      if (u) userId = (u as any).id || (u as any).userId
    }

    const doc = new EchoRequest({ userId, productId, variantId, contactEmail: email, contactPhone: phone })
    await doc.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error saving echo request:", err)
    return NextResponse.json({ error: "Failed to request echo" }, { status: 500 })
  }
}
