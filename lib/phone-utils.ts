import { Settings } from "@/models/Settings"
import { connectToDatabase } from "@/lib/mongodb"

let cachedPhoneNumber: string | null = null
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getPhoneNumber(): Promise<string> {
  const now = Date.now()
  
  // Return cached number if still valid
  if (cachedPhoneNumber && (now - lastFetch) < CACHE_DURATION) {
    return cachedPhoneNumber
  }

  try {
    await connectToDatabase()
    const setting = await Settings.findOne({ key: "whatsapp_number" })
    const phoneNumber = setting?.value || "+2348000000000"
    
    // Update cache
    cachedPhoneNumber = phoneNumber
    lastFetch = now
    
    return phoneNumber
  } catch (error) {
    console.error("Error fetching phone number:", error)
    return cachedPhoneNumber || "+2348000000000"
  }
}

export function formatPhoneForWhatsApp(phoneNumber: string): string {
  return phoneNumber.replace('+', '')
}

export function generateWhatsAppUrl(phoneNumber: string, message: string): string {
  const formattedNumber = formatPhoneForWhatsApp(phoneNumber)
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
}