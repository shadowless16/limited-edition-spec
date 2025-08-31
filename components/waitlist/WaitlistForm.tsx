"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

interface WaitlistFormProps {
  productId: string
  productName: string
  onSuccess?: () => void
}

export default function WaitlistForm({ productId, productName, onSuccess }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ productId, email }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsSuccess(true)
        setPosition(data.position)
        setEmail("")
        onSuccess?.()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to join waitlist")
      }
    } catch (error) {
      console.error("Error joining waitlist:", error)
      alert("Failed to join waitlist. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // If user is signed in, try to prefill email from /api/auth/me
    const token = localStorage.getItem("token")
    if (!token) return

    ;(async () => {
      try {
        const resp = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        if (resp.ok) {
          const data = await resp.json()
          if (data?.email) setEmail(data.email)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  if (isSuccess) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold text-primary">Successfully joined waitlist!</h3>
              <p className="text-sm text-muted-foreground">
                You're #{position} in line for {productName}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            We'll notify you via email when the originals phase launches. Check your inbox for a confirmation email.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="waitlist-email" className="text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining Waitlist...
          </>
        ) : (
          "Join Waitlist"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By joining, you'll receive email notifications about this product. You can unsubscribe at any time.
      </p>
    </form>
  )
}
