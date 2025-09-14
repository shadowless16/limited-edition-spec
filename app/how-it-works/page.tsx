import Header from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, ShoppingBag, Shield, Bell, CreditCard } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">How Limited Drops Work</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Our three-phase system ensures fair access to exclusive, limited-edition products
          </p>
        </div>

        {/* Four Phases */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                1
              </div>
              <CardTitle className="text-xl">Waitlist Phase</CardTitle>
              <CardDescription>Lock in your piece before the world sees it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Secure your spot with full payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>15% off first 7 days, then 10% off</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Priority access - numbered & limited to 100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center border-primary">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                2
              </div>
              <CardTitle className="text-xl">Originals Phase</CardTitle>
              <CardDescription>For those who missed the Waitlist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span>Purchase any remaining Originals at full price</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Same strict limit: 100 pieces only per design</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>First come, first served - gone forever when sold out</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                3
              </div>
              <CardTitle className="text-xl">Echo Phase</CardTitle>
              <CardDescription>A second chance — but never the same</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Available only if 100+ requests within 2 weeks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Limited to 150 pieces per design</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Only 2 fabrics × 2 colors offered</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                4
              </div>
              <CardTitle className="text-xl">Press Editions</CardTitle>
              <CardDescription>The rarest: only for influencers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Only 10 pieces per batch worldwide</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>1 exclusive fabric, up to 5 secret colors</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>30% surcharge for non-influencers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Explanation */}
        <div className="space-y-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Waitlist Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Secure your spot with full payment before the world sees it. Enjoy exclusive early bird pricing and get priority access with every Original numbered and limited to 100 pieces worldwide.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Secure your spot with full payment</li>
                <li>Enjoy 15% off for the first 7 days, then 10% off until Waitlist closes</li>
                <li>Get priority access — every Original is numbered and limited to 100 pieces worldwide</li>
                <li>Certificate of Authenticity included</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Originals Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For those who missed the Waitlist. Purchase any remaining Originals at full price with the same strict limit of 100 pieces only per design.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Purchase any remaining Originals at full price</li>
                <li>Same strict limit: 100 pieces only per design</li>
                <li>First come, first served — once 100 are gone, Originals are gone forever</li>
                <li>Certificate of Authenticity included</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Echo Phase Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                A second chance — but never the same. Available only if 100+ requests are made within 2 weeks after Originals sell out. All orders are prepaid and fulfilled once Echo is unlocked.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Available only if 100+ requests are made within 2 weeks after Originals sell out</li>
                <li>Limited to 150 pieces per design</li>
                <li>Only 2 fabrics × 2 colors are offered</li>
                <li>All orders prepaid and fulfilled once Echo is unlocked</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Press Editions Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Press Editions (PE) are the rarest: only 10 pieces per batch worldwide. They come in 1 exclusive fabric and up to 5 secret colors. Press Editions are given to influencers who meet requirements, or available for purchase with a 30% surcharge for non-influencers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Only 10 pieces per batch worldwide</li>
                <li>1 exclusive fabric and up to 5 secret colors</li>
                <li>Given to influencers who meet requirements</li>
                <li>Available for purchase with 30% surcharge for non-influencers</li>
                <li>Never listed publicly and cannot be restocked</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/products">Browse Current Drops</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
