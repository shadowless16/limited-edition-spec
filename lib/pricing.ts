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

export function formatPrice(priceInCents: number): string {
  // Format all prices in Nigerian Naira (NGN). Prices are stored in cents.
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(priceInCents / 100)
}

export function calculatePhasePrice(
  basePrice: number,
  phase: "waitlist" | "originals" | "echo" | "ended",
  user?: { priorityClub?: boolean; waitlistPosition?: number },
  productLaunchDate?: Date,
): PricingResult {
  let discount = 0
  let reason: PricingResult["discountReason"] = "none"
  const now = new Date()

  switch (phase) {
    case "waitlist":
      // No purchase available in waitlist phase
      return { basePrice, discount: 0, finalPrice: basePrice, discountReason: "none" }

    case "ended":
      // Product ended — no discount and not purchasable
      return { basePrice, discount: 0, finalPrice: basePrice, discountReason: "none" }

    case "originals":
      // Early bird discount for originals phase
      if (productLaunchDate) {
        const daysSinceLaunch = Math.floor((now.getTime() - productLaunchDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceLaunch <= 3) {
          discount = 20 // 20% for first 3 days
          reason = "early_bird"
        } else if (daysSinceLaunch <= 7) {
          discount = 15 // 15% for days 4-7
          reason = "early_bird"
        } else {
          discount = 10 // 10% regular originals discount
          reason = "regular"
        }
      } else {
        discount = 15 // Default originals discount
        reason = "early_bird"
      }

      // Waitlist priority bonus (additional 5% for top 50 positions)
      if (user?.waitlistPosition && user.waitlistPosition <= 50) {
        discount = Math.max(discount + 5, 25) // Cap at 25% total
        reason = "priority_club"
      }
      break

    case "echo":
      // Echo phase has regular pricing with small discount
      discount = 5
      reason = "regular"
      break
  }

  // Priority club override (minimum 12% discount)
  if (user?.priorityClub && discount < 12) {
    discount = 12
    reason = "priority_club"
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
      return `${discount}% Limited Time`
    default:
      return ""
  }
}
