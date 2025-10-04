/**
 * Owner Tag Generator
 * Format: FNL-M-LNL-F2-L2 (e.g., AKB-81-91)
 * Where:
 * - FNL = First Name Letters (first 3 consonants/letters)
 * - M = Middle initial or number
 * - LNL = Last Name Letters (first 3 consonants/letters)
 * - F2 = First 2 digits of phone
 * - L2 = Last 2 digits of phone
 */

export function generateOwnerTag(firstName: string, lastName: string, phone?: string): string {
  const firstLetter = firstName.charAt(0).toUpperCase()
  const lastLetter = lastName.charAt(0).toUpperCase()
  
  const nameParts = firstName.split(' ')
  let middleLetter: string
  
  if (nameParts.length > 1) {
    middleLetter = nameParts[1].charAt(0).toUpperCase()
  } else {
    middleLetter = firstName.charAt(1).toUpperCase()
  }
  
  const nameCode = firstLetter + middleLetter + lastLetter
  
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length >= 4) {
      const firstTwo = phoneDigits.slice(0, 2)
      const lastTwo = phoneDigits.slice(-2)
      return `${nameCode}-${firstTwo}-${lastTwo}`
    }
  }
  
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${nameCode}-${randomSuffix.slice(0, 2)}-${randomSuffix.slice(2, 4)}`
}

export function validateOwnerTag(tag: string): boolean {
  // Format validation: XXX-XX-XX pattern
  const pattern = /^[A-Z]{2,3}-\d{2}-\d{2}$/
  return pattern.test(tag)
}