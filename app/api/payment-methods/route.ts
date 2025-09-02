import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PaymentMethod } from "@/models/PaymentMethod"

export async function GET() {
  try {
    await connectToDatabase()
    const methods = await PaymentMethod.find({ enabled: true }).lean()
    return NextResponse.json(methods)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}
