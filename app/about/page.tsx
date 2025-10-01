import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, Shield, Award, Heart, Globe } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            About Mixtas
          </div>
          <h1 className="text-4xl font-bold mb-4">Premium Fashion for Modern Living</h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            We curate contemporary fashion that speaks to the modern lifestyle. Our collections blend timeless elegance with cutting-edge design, creating pieces that define your personal style.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                To provide premium fashion that empowers individuals to express their unique style. We believe fashion should be accessible, sustainable, and inspiring - creating pieces that make you feel confident and authentic in every moment.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Clear pricing, honest stock levels, and transparent processes. No hidden fees or surprise changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Fairness</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Our three-phase system ensures everyone gets a fair chance, from early waitlist members to echo phase
                  requests.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  We curate only the finest limited-edition products from trusted artisans and premium brands.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Building a community of collectors and enthusiasts who appreciate exclusivity and craftsmanship.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Pioneering new ways to make limited releases accessible while maintaining their exclusive nature.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Sustainability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Supporting sustainable practices and reducing waste through our thoughtful release system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How We're Different */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How We're Different</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Badge className="mt-1">Traditional Drops</Badge>
                  <div>
                    <h3 className="font-semibold mb-2">The Old Way</h3>
                    <p className="text-muted-foreground text-sm">
                      Surprise releases, server crashes, bots buying everything, frustrated customers, and unfair
                      distribution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Badge className="mt-1 bg-primary text-primary-foreground">LIMITED System</Badge>
                  <div>
                    <h3 className="font-semibold mb-2">Our Approach</h3>
                    <p className="text-muted-foreground text-sm">
                      Predictable phases, fair waitlist system, early bird pricing, escrow protection, and guaranteed
                      access for committed customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Built by Collectors, for Collectors</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our team consists of passionate collectors, designers, and technologists who have experienced the
                frustration of traditional limited releases firsthand. We built LIMITED to solve the problems we faced
                as customers ourselves.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Sneaker Collectors</Badge>
                <Badge variant="outline">Art Enthusiasts</Badge>
                <Badge variant="outline">Tech Innovators</Badge>
                <Badge variant="outline">Design Lovers</Badge>
                <Badge variant="outline">Sustainability Advocates</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience Fair Limited Releases?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of collectors who have discovered a better way to access exclusive products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/how-it-works">Learn How It Works</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
