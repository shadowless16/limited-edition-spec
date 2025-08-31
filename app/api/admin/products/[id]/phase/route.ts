import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { verifyToken } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectToDatabase()

    const { phase } = await request.json()

    if (!["waitlist", "originals", "echo"].includes(phase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 })
    }

    // `params` may be a Promise in Next.js App Router; await before using
    const { id } = await params as { id: string }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        currentPhase: phase,
        updatedAt: new Date(),
      },
      { new: true },
    )

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product phase:", error)
    return NextResponse.json({ error: "Failed to update product phase" }, { status: 500 })
  }
}
