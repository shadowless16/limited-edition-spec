import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { validateOwnerTag } from "@/lib/owner-tag"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerTag = searchParams.get("tag")

    if (!ownerTag) {
      return NextResponse.json({ error: "Owner tag is required" }, { status: 400 })
    }

    if (!validateOwnerTag(ownerTag)) {
      return NextResponse.json({ error: "Invalid owner tag format" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne({ ownerTag }).select("firstName lastName ownerTag createdAt")
    
    if (!user) {
      return NextResponse.json({ error: "Owner tag not found" }, { status: 404 })
    }

    return NextResponse.json({
      ownerTag: user.ownerTag,
      ownerName: `${user.firstName} ${user.lastName}`,
      registeredDate: user.createdAt,
      verified: true
    })

  } catch (error: any) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}