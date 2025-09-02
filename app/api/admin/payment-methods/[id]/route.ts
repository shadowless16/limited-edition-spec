import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PaymentMethod } from "@/models/PaymentMethod"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = (await params) as { id: string }
    const method = await PaymentMethod.findById(id).lean()
    if (!method) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(method)
  } catch (error) {
    console.error("Error getting payment method:", error)
    return NextResponse.json({ error: "Failed to get payment method" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = (await params) as { id: string }
    const data = await request.json()
    // normalize details if it's a JSON string
    if (data && typeof data.details === 'string') {
      try {
        data.details = JSON.parse(data.details)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON for details' }, { status: 400 })
      }
    }
    const method = await PaymentMethod.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    if (!method) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(method)
  } catch (error) {
    console.error("Error updating payment method:", error)
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = (await params) as { id: string }
    const method = await PaymentMethod.findByIdAndDelete(id)
    if (!method) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
  }
}
