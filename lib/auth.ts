import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

export interface AuthUser {
  // Tokens may include either `id` or `userId` depending on how they're signed.
  id?: string
  userId?: string
  email?: string
  name?: string
  ownerTag?: string
  role?: "admin" | "user" | string
  priorityClub?: boolean
  isAdmin?: boolean
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  return verifyToken(token)
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}
