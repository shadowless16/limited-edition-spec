interface PricingResult {
  basePrice: number
  discount: number
  finalPrice: number
  discountReason: "early_bird" | "priority_club" | "regular" | "none"
}

interface User {
  priorityClub: boolean
}

export function calculatePrice(basePrice: number, user: User, orderDate: Date, productLaunchDate: Date): PricingResult {
  let discount = 0
  let reason: PricingResult["discountReason"] = "none"

  const daysSinceLaunch = Math.floor((orderDate.getTime() - productLaunchDate.getTime()) / (1000 * 60 * 60 * 24))

  // Early bird discount (first 7 days)
  if (daysSinceLaunch <= 7) {
    discount = 20
    reason = "early_bird"
  }
  // Regular discount (after 7 days)
  else if (daysSinceLaunch > 7) {
    discount = 10
    reason = "regular"
  }

  // Priority club override (best available)
  if (user.priorityClub && discount < 12) {
    discount = 12
    reason = "priority_club"
  }

  const finalPrice = Math.round(basePrice * (1 - discount / 100))

  return { basePrice, discount, finalPrice, discountReason: reason }
}

export function formatPrice(priceInkobo: number): string {
  // Format all prices in Nigerian Naira (NGN). Prices are stored in kobo.
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(priceInkobo / 100)
}

export function calculatePhasePrice(
  basePrice: number,
  phase: "waitlist" | "originals" | "echo" | "press" | "ended",
  user?: { priorityClub?: boolean; waitlistPosition?: number; isInfluencer?: boolean },
  productLaunchDate?: Date,
): PricingResult {
  let discount = 0
  let reason: PricingResult["discountReason"] = "none"
  const now = new Date()

  switch (phase) {
    case "waitlist":
      // Waitlist phase allows full payment with early bird pricing
      if (productLaunchDate) {
        const daysSinceLaunch = Math.floor((now.getTime() - productLaunchDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceLaunch <= 7) {
          discount = 15 // 15% for first 7 days
          reason = "early_bird"
        } else {
          discount = 10 // 10% after first 7 days until waitlist closes
          reason = "regular"
        }
      } else {
        discount = 15 // Default early bird discount
        reason = "early_bird"
      }
      break

    case "originals":
      // Originals phase is full price - no discounts
      discount = 0
      reason = "none"
      break

    case "echo":
      // Echo phase is full price - prepaid orders
      discount = 0
      reason = "none"
      break

    case "press":
      // Press phase has 30% surcharge for non-influencers
      if (user?.isInfluencer) {
        discount = 0
        reason = "none"
      } else {
        // 30% surcharge = -30% discount
        discount = -30
        reason = "none"
      }
      break

    case "ended":
      // Product ended — no discount and not purchasable
      return { basePrice, discount: 0, finalPrice: basePrice, discountReason: "none" }
  }

  const finalPrice = Math.round(basePrice * (1 - discount / 100))
  return { basePrice, discount, finalPrice, discountReason: reason }
}

export function getDiscountLabel(discountReason: PricingResult["discountReason"], discount: number): string {
  switch (discountReason) {
    case "early_bird":
      return `${discount}% Early Bird`
    case "priority_club":
      return `${discount}% Priority Club`
    case "regular":
      return `${discount}% Waitlist Discount`
    default:
      return ""
  }
}
