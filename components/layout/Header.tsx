"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AuthModal from "@/components/auth/AuthModal"

interface UserInterface {
  id: string
  name: string
  email: string
  role: string
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [user, setUser] = useState<UserInterface | null>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetchUserData(token)
    }
  }, [])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        // fetch cart count after we have a token
        try {
          const c = await fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
          if (c.ok) {
            const cd = await c.json()
            setCartCount(Array.isArray(cd.items) ? cd.items.length : 0)
          }
        } catch (e) {
          // ignore cart fetch errors
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Listen for cart updates triggered elsewhere in the app (e.g. after adding to cart)
  useEffect(() => {
    const handler = () => {
      const token = localStorage.getItem("token")
      if (!token) return
      fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && Array.isArray(data.items)) setCartCount(data.items.length)
        })
        .catch(() => {})
    }

    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("token")
    setUser(null)
  setCartCount(0)
    window.location.reload()
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="font-bold text-xl">LIMITED</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/waitlist" className="text-sm font-medium hover:text-primary transition-colors">
              Waitlist
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                <span className="ml-1 text-sm">{cartCount}</span>
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container py-4 px-4 space-y-3">
              <Link
                href="/products"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/waitlist"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Waitlist
              </Link>
              <Link
                href="/how-it-works"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
