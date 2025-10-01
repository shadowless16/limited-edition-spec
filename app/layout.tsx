import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mixtas - Premium Fashion',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
    {/* Temporary: suppressHydrationWarning added to reduce false-positive hydration warnings
      caused by browser extensions injecting attributes (e.g., Grammarly). Prefer to
      reproduce in incognito with extensions disabled and remove this flag once fixed. */}
    <body suppressHydrationWarning className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
  {children}
  <Analytics />
  <Toaster />
      </body>
    </html>
  )
}
