"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CryptoPaymentDetails {
  bitcoinAddress?: string
  ethereumAddress?: string
  ngncAddress?: string
  litecoinAddress?: string
  instructions: string
}

interface CryptoPaymentFormProps {
  details: CryptoPaymentDetails
  onSave: (details: CryptoPaymentDetails) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function CryptoPaymentForm({ details, onSave, onCancel, isLoading = false }: CryptoPaymentFormProps) {
  const [formData, setFormData] = useState<CryptoPaymentDetails>(details)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const updateField = (field: keyof CryptoPaymentDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cryptocurrency Payment Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bitcoinAddress">Bitcoin (BTC) Address</Label>
              <Input
                id="bitcoinAddress"
                value={formData.bitcoinAddress || ''}
                onChange={(e) => updateField('bitcoinAddress', e.target.value)}
                placeholder="e.g., bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ethereumAddress">Ethereum (ETH) Address</Label>
              <Input
                id="ethereumAddress"
                value={formData.ethereumAddress || ''}
                onChange={(e) => updateField('ethereumAddress', e.target.value)}
                placeholder="e.g., 0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e9e0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ngncAddress">NGNC Address</Label>
              <Input
                id="ngncAddress"
                value={formData.ngncAddress || ''}
                onChange={(e) => updateField('ngncAddress', e.target.value)}
                placeholder="e.g., 0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e9e0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="litecoinAddress">Litecoin (LTC) Address</Label>
              <Input
                id="litecoinAddress"
                value={formData.litecoinAddress || ''}
                onChange={(e) => updateField('litecoinAddress', e.target.value)}
                placeholder="e.g., LTC1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Payment Instructions *</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Send payment to the appropriate address above and email us the transaction ID. Please allow 1-6 confirmations for processing."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Crypto Details'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}