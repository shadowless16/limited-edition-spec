import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PaymentMethod } from "@/models/PaymentMethod"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    
    const user = await verifyToken(token)
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectToDatabase()
    const methods = await PaymentMethod.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(methods)
  } catch (error) {
    console.error("Error listing payment methods:", error)
    return NextResponse.json({ error: "Failed to list payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    
    const user = await verifyToken(token)
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()
    let detailsObj = data.details ?? {}
    if (typeof data.details === 'string') {
      try {
        detailsObj = JSON.parse(data.details)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON for details' }, { status: 400 })
      }
    }
    const method = await PaymentMethod.create({
      key: data.key,
      name: data.name,
      enabled: data.enabled ?? true,
      details: detailsObj,
    })
    return NextResponse.json(method)
  } catch (error) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: "Failed to create payment method" }, { status: 500 })
  }
}
