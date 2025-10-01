import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-6">
              <span className="font-bold text-2xl tracking-wide">Mixtas</span>
            </div>
            <p className="text-background/80 text-sm leading-relaxed mb-6">
              Premium fashion for the modern lifestyle. Discover our curated collection of contemporary designs.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-background/60 hover:text-background transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-background/60 hover:text-background transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-lg">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-background/80 hover:text-background transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-background/80 hover:text-background transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-background/80 hover:text-background transition-colors">
                  Shoes
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-background/80 hover:text-background transition-colors">
                  Bags
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-background/80 hover:text-background transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-lg">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-background/80 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-background/80 hover:text-background transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-background/80 hover:text-background transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-background/80 hover:text-background transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-6 text-lg">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/faq" className="text-background/80 hover:text-background transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-background/80 hover:text-background transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-background/80 hover:text-background transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-background/80 hover:text-background transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-background/80 hover:text-background transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/60 text-sm mb-4 md:mb-0">
              © 2024 Mixtas. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/terms" className="text-background/60 hover:text-background transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-background/60 hover:text-background transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="text-background/60 hover:text-background transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
