# Limited Edition Product Release System - Technical Specification

## Tech Stack (Final Choices)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js serverless API routes (Vercel/Next.js)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Payments**: Stripe (primary) + Paystack (alternative)
- **Authentication**: NextAuth.js with magic links
- **File Storage**: Vercel Blob for COA documents
- **Email**: Resend for transactional emails

**Alternatives considered**: PostgreSQL + Prisma (rejected for simpler schema flexibility), Supabase (rejected for MongoDB preference)

## High-Level Architecture

\`\`\`mermaid
graph TD
    A[User] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[MongoDB Atlas]
    C --> E[Stripe/Paystack]
    C --> F[Email Service]
    
    G[Admin Panel] --> C
    H[Webhooks] --> C
    I[Cron Jobs] --> C
    
    subgraph "Core Flows"
        J[Waitlist Flow]
        K[Originals Flow]
        L[Echo Flow]
    end
    
    J --> K --> L
\`\`\`

## Database Schema (MongoDB Collections)

### Users Collection
\`\`\`javascript
// file: models/User.ts
{
  _id: ObjectId,
  email: string, // unique index
  phone?: string,
  firstName: string,
  lastName: string,
  priorityClub: boolean, // 12% discount eligibility
  waitlistEntries: [ObjectId], // ref to WaitlistEntry
  orders: [ObjectId], // ref to Order
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// { email: 1 } - unique
// { priorityClub: 1, createdAt: -1 }
\`\`\`

### Products Collection
\`\`\`javascript
// file: models/Product.ts
{
  _id: ObjectId,
  sku: string, // unique, e.g., "AB-B1-BG1"
  name: string,
  description: string,
  basePrice: number, // in cents
  images: [string], // URLs
  variants: [{
    color: string,
    material: string,
    stock: number,
    reservedStock: number // for pending orders
  }],
  releasePhases: {
    waitlist: {
      startDate: Date,
      endDate: Date,
      isActive: boolean
    },
    originals: {
      startDate: Date,
      endDate: Date,
      isActive: boolean,
      maxQuantity: number
    },
    echo: {
      startDate: Date,
      endDate: Date,
      isActive: boolean,
      windowDays: number // default 30
    }
  },
  status: "draft" | "waitlist" | "originals" | "echo" | "ended",
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// { sku: 1 } - unique
// { status: 1, "releasePhases.originals.startDate": 1 }
\`\`\`

### WaitlistEntries Collection
\`\`\`javascript
// file: models/WaitlistEntry.ts
{
  _id: ObjectId,
  userId: ObjectId, // ref to User
  productId: ObjectId, // ref to Product
  position: number, // queue position
  preferredVariants: [string], // ["black", "leather"]
  joinedAt: Date,
  notified: boolean, // for OG phase notification
  status: "active" | "converted" | "expired"
}

// Indexes:
// { productId: 1, position: 1 }
// { userId: 1, productId: 1 } - compound unique
\`\`\`

### Orders Collection
\`\`\`javascript
// file: models/Order.ts
{
  _id: ObjectId,
  orderNumber: string, // unique, e.g., "ORD-2024-001234"
  userId: ObjectId,
  productId: ObjectId,
  variant: {
    color: string,
    material: string
  },
  quantity: number,
  pricing: {
    basePrice: number,
    discount: number, // percentage
    finalPrice: number,
    discountReason: "early_bird" | "priority_club" | "none"
  },
  phase: "originals" | "echo",
  status: "pending" | "paid" | "shipped" | "delivered" | "refunded",
  paymentIntentId: string, // Stripe/Paystack ID
  coaCode?: string, // generated after payment
  escrowReleaseDate?: Date, // for EC orders
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// { orderNumber: 1 } - unique
// { userId: 1, createdAt: -1 }
// { status: 1, escrowReleaseDate: 1 }
// { paymentIntentId: 1 }
\`\`\`

### EchoRequests Collection
\`\`\`javascript
// file: models/EchoRequest.ts
{
  _id: ObjectId,
  userId: ObjectId,
  productId: ObjectId,
  requestedVariant: {
    color: string,
    material: string
  },
  status: "pending" | "approved" | "rejected" | "expired",
  adminNotes?: string,
  requestedAt: Date,
  reviewedAt?: Date,
  reviewedBy?: ObjectId, // admin user
  expiresAt: Date // 30 days from request
}

// Indexes:
// { status: 1, expiresAt: 1 }
// { userId: 1, productId: 1 }
\`\`\`

### COA Collection (Certificate of Authenticity)
\`\`\`javascript
// file: models/COA.ts
{
  _id: ObjectId,
  coaCode: string, // unique, e.g., "AB-B1-BG1-OG-LE-BK-034"
  orderId: ObjectId,
  productSku: string,
  phase: "OG" | "EC" | "PE", // Originals, Echo, Press/Employee
  variant: {
    color: string,
    material: string
  },
  serialNumber: number, // incremental per product
  issuedAt: Date,
  documentUrl?: string // PDF certificate URL
}

// Indexes:
// { coaCode: 1 } - unique
// { orderId: 1 } - unique
\`\`\`

### AdminLogs Collection
\`\`\`javascript
// file: models/AdminLog.ts
{
  _id: ObjectId,
  adminId: ObjectId,
  action: string, // "close_waitlist", "approve_echo", "trigger_refund"
  targetType: "product" | "order" | "echo_request",
  targetId: ObjectId,
  details: Object, // flexible metadata
  timestamp: Date
}

// Indexes:
// { adminId: 1, timestamp: -1 }
// { targetType: 1, targetId: 1 }
\`\`\`

## REST API Endpoints

### Authentication
\`\`\`typescript
// file: pages/api/auth/magic-link.ts
POST /api/auth/magic-link
Request: { email: string }
Response: { success: boolean, message: string }
Validation: email format, rate limiting (5/hour per email)

POST /api/auth/verify
Request: { token: string }
Response: { success: boolean, user?: User, sessionToken?: string }
\`\`\`

### Products
\`\`\`typescript
// file: pages/api/products/index.ts
GET /api/products
Query: ?phase=waitlist|originals|echo&status=active
Response: { products: Product[], total: number }

GET /api/products/[sku]
Response: { product: Product, userWaitlistStatus?: WaitlistEntry }
\`\`\`

### Waitlist
\`\`\`typescript
// file: pages/api/waitlist/join.ts
POST /api/waitlist/join
Request: { 
  productId: string, 
  preferredVariants: string[] 
}
Response: { 
  success: boolean, 
  position: number, 
  estimatedNotificationDate: string 
}
Validation: user authenticated, product in waitlist phase, not already joined
\`\`\`

### Orders
\`\`\`typescript
// file: pages/api/orders/create.ts
POST /api/orders/create
Request: {
  productId: string,
  variant: { color: string, material: string },
  quantity: number
}
Response: {
  order: Order,
  paymentIntent: { clientSecret: string, amount: number }
}
Validation: stock availability, phase eligibility, atomic stock reservation

GET /api/orders/[orderNumber]
Response: { order: Order, coa?: COA }
\`\`\`

### Echo Requests
\`\`\`typescript
// file: pages/api/echo/request.ts
POST /api/echo/request
Request: {
  productId: string,
  requestedVariant: { color: string, material: string }
}
Response: { 
  request: EchoRequest, 
  estimatedReviewTime: string 
}
Validation: product in echo phase, user hasn't requested same variant
\`\`\`

### Webhooks
\`\`\`typescript
// file: pages/api/webhooks/stripe.ts
POST /api/webhooks/stripe
Headers: stripe-signature
Body: Stripe webhook payload
Actions: update order status, generate COA, send confirmation email

// Signature verification pseudo-code:
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
\`\`\`

### Admin Endpoints
\`\`\`typescript
// file: pages/api/admin/waitlist/close.ts
POST /api/admin/waitlist/close
Request: { productId: string }
Response: { success: boolean, notifiedUsers: number }

POST /api/admin/echo/review
Request: { 
  requestId: string, 
  action: "approve" | "reject", 
  notes?: string 
}
Response: { success: boolean }
\`\`\`

## Pricing & Discount Logic

\`\`\`typescript
// file: lib/pricing.ts
function calculatePrice(basePrice: number, user: User, orderDate: Date, productLaunchDate: Date): PricingResult {
  let discount = 0;
  let reason = "none";
  
  const daysSinceLaunch = Math.floor((orderDate - productLaunchDate) / (1000 * 60 * 60 * 24));
  
  // Early bird discount (first 7 days)
  if (daysSinceLaunch <= 7) {
    discount = 20;
    reason = "early_bird";
  }
  // Regular discount (after 7 days)
  else if (daysSinceLaunch > 7) {
    discount = 10;
    reason = "regular";
  }
  
  // Priority club override (best available)
  if (user.priorityClub && discount < 12) {
    discount = 12;
    reason = "priority_club";
  }
  
  const finalPrice = Math.round(basePrice * (1 - discount / 100));
  
  return { basePrice, discount, finalPrice, reason };
}
\`\`\`

## COA Code Generation

\`\`\`typescript
// file: lib/coa-generator.ts
function generateCOACode(product: Product, phase: "OG" | "EC" | "PE", variant: Variant, serialNumber: number): string {
  // Format: AB-B1-BG1-OG-LE-BK-034
  // AB-B1-BG1: Product SKU
  // OG: Phase (OG/EC/PE)
  // LE: Limited Edition marker
  // BK: Variant code (first 2 letters of color)
  // 034: Serial number (3 digits, zero-padded)
  
  const productCode = product.sku; // "AB-B1-BG1"
  const phaseCode = phase; // "OG", "EC", "PE"
  const editionCode = "LE"; // Always "LE" for limited edition
  const variantCode = variant.color.substring(0, 2).toUpperCase(); // "BK" for black
  const serialCode = serialNumber.toString().padStart(3, '0'); // "034"
  
  return `${productCode}-${phaseCode}-${editionCode}-${variantCode}-${serialCode}`;
}

// Examples:
// AB-B1-BG1-OG-LE-BK-001 (First black original)
// AB-B1-BG1-EC-LE-WH-015 (15th white echo)
// AB-B1-BG1-PE-LE-BR-003 (3rd brown press/employee)
\`\`\`

## Escrow & Refund Logic

\`\`\`typescript
// file: lib/escrow.ts
// DB States for Echo Orders:
// 1. "pending" -> payment received, in escrow
// 2. "paid" -> escrow released, order confirmed
// 3. "refunded" -> escrow returned to customer

// Cron job evaluation (runs daily)
async function evaluateEchoOrders() {
  const expiredOrders = await Order.find({
    phase: "echo",
    status: "pending",
    escrowReleaseDate: { $lte: new Date() }
  });
  
  for (const order of expiredOrders) {
    if (await hasEchoApproval(order)) {
      await releaseEscrow(order);
      await updateOrderStatus(order._id, "paid");
      await generateCOA(order);
    } else {
      await processRefund(order);
      await updateOrderStatus(order._id, "refunded");
    }
  }
}

// Refund batch processing
async function processRefundBatch(orderIds: string[]) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    for (const orderId of orderIds) {
      await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        reason: "requested_by_customer"
      });
      await Order.updateOne({ _id: orderId }, { status: "refunded" });
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
\`\`\`

## Mobile-First UI Components

\`\`\`
components/
├── layout/
│   ├── Header.tsx              # Mobile hamburger menu, logo
│   ├── Footer.tsx              # Minimal footer with links
│   └── Navigation.tsx          # Mobile-first nav drawer
├── product/
│   ├── ProductCard.tsx         # Single-column card with image, price, CTA
│   ├── ProductGrid.tsx         # Single-column grid on mobile
│   ├── VariantPicker.tsx       # Color/material selector (stacked)
│   ├── PriceDisplay.tsx        # Price with discount badge
│   └── StockIndicator.tsx      # Low stock warnings
├── waitlist/
│   ├── WaitlistForm.tsx        # Email + preferences form
│   ├── WaitlistPosition.tsx    # Queue position display
│   └── WaitlistStatus.tsx      # Join/joined state
├── orders/
│   ├── OrderSummary.tsx        # Mobile-optimized checkout
│   ├── PaymentForm.tsx         # Stripe Elements integration
│   ├── OrderConfirmation.tsx   # Success state with COA
│   └── OrderHistory.tsx        # List view of past orders
├── echo/
│   ├── EchoRequestForm.tsx     # Variant request form
│   ├── EchoStatus.tsx          # Request status tracker
│   └── EchoTimer.tsx           # Countdown to window close
├── auth/
│   ├── MagicLinkForm.tsx       # Email input for magic link
│   ├── AuthGuard.tsx           # Route protection wrapper
│   └── UserProfile.tsx         # Basic profile management
└── ui/
    ├── Button.tsx              # Primary/secondary variants
    ├── Input.tsx               # Form inputs with validation
    ├── Modal.tsx               # Mobile-friendly modals
    ├── Toast.tsx               # Success/error notifications
    └── LoadingSpinner.tsx      # Loading states
\`\`\`

### Mobile Mockup (ASCII)
\`\`\`
┌─────────────────────┐
│ ☰  BRAND      🛒 0  │ <- Header
├─────────────────────┤
│                     │
│  [Product Image]    │
│                     │
│  Product Name       │
│  $299 $239 (-20%)   │ <- Price with discount
│                     │
│  ○ Black  ○ White   │ <- Variant picker
│  ○ Leather ○ Canvas │
│                     │
│  Stock: 12 left     │
│                     │
│ [Join Waitlist]     │ <- CTA button (full width)
│                     │
│  Position: #47      │ <- Waitlist status
│  Est. notify: 3 days│
│                     │
└─────────────────────┘
\`\`\`

## Admin Panel Features

### Wireframe Items
\`\`\`
admin/
├── dashboard/
│   ├── page.tsx                # Overview metrics, active products
│   ├── products/
│   │   ├── page.tsx           # Product list with phase controls
│   │   ├── [id]/edit.tsx      # Product editor
│   │   └── [id]/phases.tsx    # Phase date management
│   ├── waitlist/
│   │   ├── page.tsx           # Waitlist overview by product
│   │   └── [productId].tsx    # Individual waitlist management
│   ├── orders/
│   │   ├── page.tsx           # Order search and filters
│   │   └── [orderNumber].tsx  # Order details and actions
│   ├── echo/
│   │   ├── page.tsx           # Pending echo requests
│   │   └── bulk-actions.tsx   # Batch approve/reject
│   └── refunds/
│       ├── page.tsx           # Refund queue and triggers
│       └── batch.tsx          # Bulk refund processing
\`\`\`

### Key Admin Controls
- **Waitlist Close Date Editor**: Calendar picker with automatic notification scheduling
- **Echo Materials/Colors Picker**: Dynamic variant approval interface
- **Refund Trigger**: Bulk selection with confirmation modal
- **Order Viewer**: Search by email, order number, COA code with export

## Security & Compliance

### Stock Race Condition Prevention
\`\`\`typescript
// file: lib/inventory.ts
// Use MongoDB atomic operations for stock management
async function reserveStock(productId: string, variant: Variant, quantity: number): Promise<boolean> {
  const result = await Product.updateOne(
    {
      _id: productId,
      "variants.color": variant.color,
      "variants.material": variant.material,
      $expr: {
        $gte: [
          { $subtract: ["$variants.$.stock", "$variants.$.reservedStock"] },
          quantity
        ]
      }
    },
    {
      $inc: { "variants.$.reservedStock": quantity }
    }
  );
  
  return result.modifiedCount > 0;
}
\`\`\`

### PCI Compliance
- Never store card details (use Stripe/Paystack tokens only)
- All payment forms use hosted payment pages or Elements
- Webhook endpoints validate signatures
- Order data encrypted at rest (MongoDB Atlas encryption)

### Data Retention
- Order data: 7 years for tax compliance
- Payment logs: 3 years minimum
- User data: Delete on request (GDPR compliance)
- COA records: Permanent (authenticity verification)

## Deployment Checklist

### Environment Variables Required
\`\`\`bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=limited_edition_prod

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
MAGIC_LINK_SECRET=...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# File Storage
BLOB_READ_WRITE_TOKEN=...

# Admin
ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
\`\`\`

### Webhook Endpoints
- `https://yourdomain.com/api/webhooks/stripe`
- `https://yourdomain.com/api/webhooks/paystack`

### Backup Strategy
- MongoDB Atlas automated backups (point-in-time recovery)
- Weekly export of critical collections to Vercel Blob
- COA document backups to separate storage provider

## Test Plan & Postman Collection

### Critical Test Flows
1. **Waitlist Journey**: Join → Notification → Purchase
2. **Stock Management**: Concurrent order attempts
3. **Payment Processing**: Success/failure webhooks
4. **Echo Request**: Submit → Admin review → Approval/rejection
5. **Refund Processing**: Manual and automatic triggers

### Postman Collection Structure
\`\`\`json
{
  "info": { "name": "Limited Edition API Tests" },
  "item": [
    {
      "name": "Authentication",
      "item": [
        { "name": "Send Magic Link", "request": { "method": "POST", "url": "{{base_url}}/api/auth/magic-link" } },
        { "name": "Verify Token", "request": { "method": "POST", "url": "{{base_url}}/api/auth/verify" } }
      ]
    },
    {
      "name": "Waitlist Flow",
      "item": [
        { "name": "Join Waitlist", "request": { "method": "POST", "url": "{{base_url}}/api/waitlist/join" } },
        { "name": "Check Position", "request": { "method": "GET", "url": "{{base_url}}/api/waitlist/status" } }
      ]
    },
    {
      "name": "Order Flow",
      "item": [
        { "name": "Create Order", "request": { "method": "POST", "url": "{{base_url}}/api/orders/create" } },
        { "name": "Get Order", "request": { "method": "GET", "url": "{{base_url}}/api/orders/{{order_number}}" } }
      ]
    }
  ]
}
\`\`\`

## Flow Transition Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Waitlist: Product Launch
    Waitlist --> Originals: Admin closes WL
    Originals --> Echo: OG phase ends
    Echo --> Ended: EC window closes
    
    state Waitlist {
        [*] --> Collecting
        Collecting --> Notifying: Close date reached
        Notifying --> [*]
    }
    
    state Originals {
        [*] --> Selling
        Selling --> SoldOut: Stock depleted
        Selling --> TimeUp: Phase ends
        SoldOut --> [*]
        TimeUp --> [*]
    }
    
    state Echo {
        [*] --> Requesting
        Requesting --> Reviewing: Admin processes
        Reviewing --> Approved: Admin approves
        Reviewing --> Rejected: Admin rejects
        Approved --> Paid: Customer pays
        Rejected --> [*]
        Paid --> [*]
    }
\`\`\`

## Developer Implementation Checklist

1. **Database Setup**: Create MongoDB Atlas cluster, configure collections and indexes
2. **Authentication**: Implement NextAuth.js with magic link provider and user model
3. **Payment Integration**: Set up Stripe/Paystack accounts, configure webhooks, test payment flows
4. **Core Models**: Build Mongoose schemas for all collections with proper validation
5. **API Routes**: Implement all endpoints with proper error handling and rate limiting
6. **Mobile UI**: Build responsive components starting with ProductCard and WaitlistForm
7. **Admin Panel**: Create basic CRUD operations for products and order management
8. **Testing**: Set up test database, create Postman collection, implement unit tests for pricing logic

**Priority Order**: Auth → Database → Payment → Core UI → Admin → Advanced Features
