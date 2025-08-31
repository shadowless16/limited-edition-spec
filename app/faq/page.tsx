"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "How does the three-phase release system work?",
    answer:
      "Our products are released in three phases: Waitlist (join for early access), Originals (limited quantity with premium pricing), and Echo (final availability with standard pricing). Each phase offers different benefits and pricing.",
  },
  {
    question: "What is the Priority Club and how do I join?",
    answer:
      "The Priority Club is our membership program that offers exclusive benefits including early access, special discounts, and priority customer support. You can join by making your first purchase or through special invitations.",
  },
  {
    question: "How do I know if a product is authentic?",
    answer:
      "Every limited edition product comes with a unique Certificate of Authenticity (COA) that includes a serial number and authenticity hash. You can verify your product's authenticity using the COA details.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Orders can be cancelled within 24 hours of placement if the product hasn't entered the fulfillment process. Contact our support team for assistance with cancellations.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available for an additional fee. You'll receive tracking information once your order ships.",
  },
  {
    question: "What if I miss the Originals phase?",
    answer:
      "If you miss the Originals phase, you can still purchase during the Echo phase, though quantities are limited and pricing may be different. Join our waitlist to get notified about future releases.",
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground">Everything you need to know about LIMITED's exclusive releases</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg">
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
              onClick={() => toggleItem(index)}
            >
              <span className="font-medium">{faq.question}</span>
              {openItems.includes(index) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">Still have questions? We're here to help.</p>
        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Contact Support
        </button>
      </div>
    </div>
  )
}
