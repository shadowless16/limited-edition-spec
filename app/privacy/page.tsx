import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We collect information you provide directly to us, such as when you:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Create an account or join our waitlist</li>
            <li>Make a purchase or place an order</li>
            <li>Contact us for customer support</li>
            <li>Subscribe to our newsletter</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Process transactions and send order confirmations</li>
            <li>Manage waitlist positions and notify about product availability</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction.
          </p>
        </section>
      </div>
      </div>
      
      <Footer />
    </div>
  )
}
