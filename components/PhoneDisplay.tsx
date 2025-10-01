"use client"

import { useState, useEffect } from "react"
import { Phone } from "lucide-react"

interface PhoneDisplayProps {
  className?: string
  showIcon?: boolean
  format?: "full" | "link" | "whatsapp"
}

export default function PhoneDisplay({ className = "", showIcon = true, format = "full" }: PhoneDisplayProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPhoneNumber()
  }, [])

  const fetchPhoneNumber = async () => {
    try {
      const response = await fetch("/api/settings/public")
      if (response.ok) {
        const data = await response.json()
        setPhoneNumber(data.whatsappNumber || "+2348000000000")
      }
    } catch (error) {
      console.error("Error fetching phone number:", error)
      setPhoneNumber("+2348000000000")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={`animate-pulse bg-muted rounded h-4 w-32 ${className}`} />
  }

  const formatPhone = () => {
    switch (format) {
      case "link":
        return `tel:${phoneNumber}`
      case "whatsapp":
        return `https://wa.me/${phoneNumber.replace('+', '')}`
      default:
        return phoneNumber
    }
  }

  const displayText = phoneNumber

  if (format === "link") {
    return (
      <a href={formatPhone()} className={`flex items-center gap-2 hover:underline ${className}`}>
        {showIcon && <Phone className="h-4 w-4" />}
        {displayText}
      </a>
    )
  }

  if (format === "whatsapp") {
    return (
      <a href={formatPhone()} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 hover:underline ${className}`}>
        {showIcon && <Phone className="h-4 w-4" />}
        {displayText}
      </a>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Phone className="h-4 w-4" />}
      {displayText}
    </div>
  )
}