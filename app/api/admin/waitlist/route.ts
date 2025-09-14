import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { WaitlistEntry } from "@/models/WaitlistEntry"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // support simple filtering/sorting via query params
    const { searchParams } = new URL(request.url)
    const filter: any = {}
    if (searchParams.get('productId')) filter.productId = searchParams.get('productId')
    if (searchParams.get('status')) filter.status = searchParams.get('status')

    const sortField = searchParams.get('sort') || 'createdAt'
    const sortOrder = searchParams.get('order') === 'asc' ? 1 : -1
    const limit = Number(searchParams.get('limit') || '100')

    // Populate product name, sku and current phase/status and user's email & phone for admin display
    const waitlistEntries = await WaitlistEntry.find(filter)
      .populate("productId", "name sku status currentPhase")
      .populate("userId", "email phone")
      .sort({ [sortField]: sortOrder })
      .limit(Math.min(limit, 1000))

    // Transform to include email at top-level for ease of rendering in admin UI
    const transformed = waitlistEntries.map((entry) => ({
      _id: entry._id,
      product: entry.productId ? {
        id: (entry.productId as any)._id,
        name: (entry.productId as any).name,
        sku: (entry.productId as any).sku,
        status: (entry.productId as any).status,
        currentPhase: (entry.productId as any).currentPhase,
      } : null,
  email: (entry as any).userId?.email || null,
  phone: (entry as any).userId?.phone || null,
      position: entry.position,
      status: entry.status,
      createdAt: entry.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching waitlist entries:", error)
    return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 })
  }
}
