"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface BankTransferDetails {
  bankName: string
  accountNumber: string
  routingNumber: string
  accountHolderName: string
  swiftCode?: string
  iban?: string
  instructions: string
}

interface BankTransferFormProps {
  details: BankTransferDetails
  onSave: (details: BankTransferDetails) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function BankTransferForm({ details, onSave, onCancel, isLoading = false }: BankTransferFormProps) {
  const [formData, setFormData] = useState<BankTransferDetails>(details)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const updateField = (field: keyof BankTransferDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Transfer Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="e.g., Chase Bank"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => updateField('accountHolderName', e.target.value)}
                placeholder="e.g., Your Business Name LLC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => updateField('accountNumber', e.target.value)}
                placeholder="e.g., 1234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number *</Label>
              <Input
                id="routingNumber"
                value={formData.routingNumber}
                onChange={(e) => updateField('routingNumber', e.target.value)}
                placeholder="e.g., 021000021"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT Code (International)</Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode || ''}
                onChange={(e) => updateField('swiftCode', e.target.value)}
                placeholder="e.g., CHASUS33"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN (International)</Label>
              <Input
                id="iban"
                value={formData.iban || ''}
                onChange={(e) => updateField('iban', e.target.value)}
                placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Payment Instructions *</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Please include your order number in the transfer reference. Transfers typically take 1-3 business days to process."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Bank Details'}
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