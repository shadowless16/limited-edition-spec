import { type NextRequest, NextResponse } from "next/server"
import { getPhoneNumber } from "@/lib/phone-utils"

export async function GET(request: NextRequest) {
  try {
    const phoneNumber = await getPhoneNumber()
    
    return NextResponse.json({
      phoneNumber,
      success: true
    })
  } catch (error) {
    console.error("Error fetching phone number:", error)
    return NextResponse.json({ 
      phoneNumber: "+2348000000000",
      success: false,
      error: "Failed to fetch phone number" 
    }, { status: 500 })
  }
}