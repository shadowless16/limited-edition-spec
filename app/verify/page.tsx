"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VerificationResult {
  ownerTag: string
  ownerName: string
  registeredDate: string
  verified: boolean
}

export default function VerifyPage() {
  const [ownerTag, setOwnerTag] = useState("")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!ownerTag.trim()) {
      setError("Please enter an owner tag")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(`/api/verify?tag=${encodeURIComponent(ownerTag.trim())}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Owner Tag Verification</h1>
        <p className="text-muted-foreground">
          Verify the authenticity of your limited edition piece by entering your owner tag
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Owner Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., AKB-81-91"
              value={ownerTag}
              onChange={(e) => setOwnerTag(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
            />
            <Button onClick={handleVerify} disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-6 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Verified Authentic
                </Badge>
              </div>
              <div className="space-y-2">
                <p><strong>Owner Tag:</strong> {result.ownerTag}</p>
                <p><strong>Owner:</strong> {result.ownerName}</p>
                <p><strong>Registered:</strong> {new Date(result.registeredDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Owner tags are unique identifiers shown on receipts and certificates.</p>
        <p>No personal information is displayed during verification.</p>
      </div>
    </div>
  )
}