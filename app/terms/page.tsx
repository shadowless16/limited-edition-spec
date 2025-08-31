export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using LIMITED's platform, you accept and agree to be bound by the terms and provision of
            this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Limited Edition Products</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our products are released in limited quantities through a three-phase system:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Waitlist Phase:</strong> Users can join the waitlist for early access
            </li>
            <li>
              <strong>Originals Phase:</strong> Limited quantity release with premium pricing
            </li>
            <li>
              <strong>Echo Phase:</strong> Final availability with standard pricing
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Pricing and Payments</h2>
          <p className="text-muted-foreground leading-relaxed">
            All prices are subject to change. Early bird discounts and priority club benefits apply as specified.
            Payment is processed securely through Stripe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Certificate of Authenticity</h2>
          <p className="text-muted-foreground leading-relaxed">
            Each limited edition product comes with a unique Certificate of Authenticity (COA) that verifies the
            product's authenticity and limited edition status.
          </p>
        </section>
      </div>
    </div>
  )
}
