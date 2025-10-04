import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { generateOwnerTag } from "@/lib/owner-tag"
import { getAuthUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectToDatabase()
    
    const usersWithoutTags = await User.find({ ownerTag: { $exists: false } })
    const results = []
    
    for (const userDoc of usersWithoutTags) {
      const ownerTag = generateOwnerTag(userDoc.firstName, userDoc.lastName, userDoc.phone)
      
      await User.updateOne(
        { _id: userDoc._id },
        { $set: { ownerTag } }
      )
      
      results.push({
        name: `${userDoc.firstName} ${userDoc.lastName}`,
        ownerTag
      })
    }
    
    return NextResponse.json({
      message: `Migration complete! Updated ${results.length} users`,
      results
    })
    
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}