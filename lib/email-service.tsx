interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export const sendEmail = async ({ to, subject, template, data }: EmailData): Promise<void> => {
  try {
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend

    console.log(`[EMAIL] Sending ${template} email to ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] Data:`, data)

    // For now, we'll simulate email sending
    // Replace this with actual email service integration

    if (template === "waitlist-confirmation") {
      console.log(`[EMAIL] Waitlist confirmation sent to ${to} - Position: ${data.position}`)
    } else if (template === "order-confirmation") {
      console.log(`[EMAIL] Order confirmation sent to ${to} - Order: ${data.orderNumber}`)
    } else if (template === "order-shipped") {
      console.log(`[EMAIL] Shipping notification sent to ${to} - Tracking: ${data.trackingNumber}`)
    }

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100))
  } catch (error) {
    console.error("Failed to send email:", error)
    throw new Error("Email sending failed")
  }
}

// Email templates
export const emailTemplates = {
  "waitlist-confirmation": {
    subject: "You're on the waitlist!",
    html: (data: any) => `
      <h1>Welcome to the waitlist!</h1>
      <p>You're position #${data.position} for ${data.productName}.</p>
      <p>We'll notify you when it's available.</p>
    `,
  },
  "order-confirmation": {
    subject: "Order confirmed!",
    html: (data: any) => `
      <h1>Order Confirmed</h1>
      <p>Your order ${data.orderNumber} has been confirmed.</p>
      <p>Total: $${(data.total / 100).toFixed(2)}</p>
    `,
  },
  "order-shipped": {
    subject: "Your order has shipped!",
    html: (data: any) => `
      <h1>Order Shipped</h1>
      <p>Your order ${data.orderNumber} has shipped!</p>
      <p>Tracking: ${data.trackingNumber}</p>
      <p>Carrier: ${data.shippingCarrier}</p>
      <p>Estimated delivery: ${data.estimatedDelivery}</p>
    `,
  },
}

export class EmailService {
  static async sendEmail(emailData: EmailData): Promise<void> {
    return sendEmail(emailData)
  }

  static createOrderConfirmationEmail(data: {
    userName: string
    orderNumber: string
    productName: string
    amount: number
    shippingAddress: string
  }): EmailData {
    return {
      to: data.userName, // This should be email, but keeping consistent with usage
      subject: `Order Confirmation - ${data.orderNumber}`,
      template: "order-confirmation",
      data: {
        userName: data.userName,
        orderNumber: data.orderNumber,
        productName: data.productName,
        total: data.amount,
        shippingAddress: data.shippingAddress,
      },
    }
  }

  static createWaitlistConfirmationEmail(data: {
    email: string
    position: number
    productName: string
  }): EmailData {
    return {
      to: data.email,
      subject: "You're on the waitlist!",
      template: "waitlist-confirmation",
      data: {
        position: data.position,
        productName: data.productName,
      },
    }
  }

  static createShippingNotificationEmail(data: {
    email: string
    orderNumber: string
    trackingNumber: string
    shippingCarrier: string
    estimatedDelivery: string
  }): EmailData {
    return {
      to: data.email,
      subject: `Your order ${data.orderNumber} has shipped!`,
      template: "order-shipped",
      data: {
        orderNumber: data.orderNumber,
        trackingNumber: data.trackingNumber,
        shippingCarrier: data.shippingCarrier,
        estimatedDelivery: data.estimatedDelivery,
      },
    }
  }
}

export default { sendEmail, emailTemplates, EmailService }
