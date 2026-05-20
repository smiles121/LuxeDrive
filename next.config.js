# ✦ LuxeDrive — Premium Car Rental Platform

> *Drive in Absolute Luxury*

A production-ready, full-stack car rental platform built for the Nigerian market. LuxeDrive is a monorepo application featuring a Next.js frontend, Express.js API, PostgreSQL database, Paystack payments, and a comprehensive admin dashboard.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start](#quick-start)
5. [Environment Setup](#environment-setup)
6. [Database Setup](#database-setup)
7. [Running Locally](#running-locally)
8. [Feature Guide](#feature-guide)
9. [API Reference](#api-reference)
10. [Deployment](#deployment)
11. [Customization Guide](#customization-guide)
12. [Security](#security)
13. [Troubleshooting](#troubleshooting)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│              Next.js 14 (App Router)                     │
│         Tailwind CSS · Framer Motion · Zustand           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│                  EXPRESS.JS API                          │
│        JWT Auth · Rate Limiting · Validation             │
│          Paystack · Cloudinary · Nodemailer              │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────────┐
│               POSTGRESQL DATABASE                        │
│        (Railway or Supabase for production)              │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | Next.js 14, React 18, TypeScript            |
| Styling      | Tailwind CSS, Framer Motion, shadcn/ui       |
| State        | Zustand, TanStack Query                      |
| Backend      | Node.js, Express.js, TypeScript              |
| Database     | PostgreSQL (via Prisma ORM)                  |
| Auth         | JWT (access + refresh tokens), bcrypt        |
| Payments     | **Paystack** (primary), Stripe (optional)    |
| Storage      | Cloudinary (vehicle images)                  |
| Email        | Nodemailer + Handlebars templates            |
| SMS          | Twilio                                       |
| Deployment   | Vercel (web), Railway (API + DB)             |
| Monorepo     | Turborepo + npm workspaces                   |

---

## 📂 Project Structure

```
luxedrive/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── public-pages/   # Home, About, Vehicles, etc.
│   │   │   │   ├── auth/           # Login, Register, etc.
│   │   │   │   ├── user/           # Customer dashboard
│   │   │   │   └── admin/          # Admin dashboard
│   │   │   ├── components/         # Reusable UI components
│   │   │   ├── lib/                # API client, hooks, utils
│   │   │   ├── store/              # Zustand state stores
│   │   │   └── types/              # Frontend-specific types
│   │   ├── public/                 # Static assets
│   │   └── tailwind.config.ts      # LuxeDrive design tokens
│   │
│   └── api/                        # Express.js backend
│       ├── src/
│       │   ├── routes/             # Express route definitions
│       │   ├── controllers/        # Business logic handlers
│       │   ├── middleware/         # Auth, validation, rate limiting
│       │   ├── services/           # Email, payment, storage, SMS
│       │   ├── validators/         # Zod schemas
│       │   ├── utils/              # AppError, asyncHandler, seed
│       │   └── config/             # Prisma client, Redis
│       ├── prisma/
│       │   └── schema.prisma       # Full database schema
│       └── email-templates/        # Handlebars .hbs templates
│
├── packages/
│   ├── types/                      # Shared TypeScript types
│   ├── utils/                      # Shared utilities
│   ├── ui/                         # Shared UI primitives
│   └── email-templates/            # Email template source
│
├── docs/                           # Additional documentation
├── scripts/                        # Deployment & maintenance scripts
├── .env.example                    # Environment variable template
├── turbo.json                      # Turborepo pipeline config
└── package.json                    # Root workspace config
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** (local or Railway)
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/your-org/luxedrive.git
cd luxedrive
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
```

Edit both files and fill in your credentials (see [Environment Setup](#environment-setup) below).

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:migrate

# Seed with sample data (vehicles, admin user, coupons)
npm run db:seed
```

### 4. Start Development Servers

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:**      http://localhost:4000
- **API Health:** http://localhost:4000/health
- **Prisma Studio:** `npm run db:studio` → http://localhost:5555

---

## 🔑 Environment Setup

### Required Accounts

| Service       | Purpose                    | Link                              | Free Tier |
|---------------|----------------------------|-----------------------------------|-----------|
| Paystack      | Primary payments (NGN)     | https://paystack.com              | ✅ Yes     |
| Railway       | API hosting + PostgreSQL   | https://railway.app               | ✅ $5/mo  |
| Cloudinary    | Vehicle image storage      | https://cloudinary.com            | ✅ Yes     |
| Resend.com    | Transactional emails       | https://resend.com                | ✅ Yes     |
| Vercel        | Frontend hosting           | https://vercel.com                | ✅ Yes     |
| Twilio        | SMS reminders (optional)   | https://twilio.com                | ✅ Trial   |

### Critical Variables

```bash
# DATABASE — get from Railway
DATABASE_URL="postgresql://..."

# JWT — generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char hex string>
JWT_REFRESH_SECRET=<different 64-char hex string>

# PAYSTACK — from dashboard.paystack.com → Settings → API Keys
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...

# CLOUDINARY — from cloudinary.com/console
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🗄 Database Setup

### Schema Overview

| Table                  | Purpose                          |
|------------------------|----------------------------------|
| `users`                | Customers and admins             |
| `vehicles`             | Car fleet catalog                |
| `vehicle_images`       | Cloudinary image references      |
| `bookings`             | Rental reservations              |
| `payments`             | Paystack/Stripe transactions     |
| `schedules`            | Pickup & dropoff logistics       |
| `reviews`              | Vehicle ratings                  |
| `saved_vehicles`       | Customer wishlists               |
| `coupons`              | Discount codes                   |
| `notifications`        | In-app notifications             |
| `support_tickets`      | Customer support                 |
| `ticket_replies`       | Support thread messages          |
| `loyalty_transactions` | Points earn/redeem history       |
| `site_settings`        | Admin-configurable settings      |

### Migrations

```bash
# Create and apply a new migration
cd apps/api
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (⚠️ destroys all data)
npx prisma migrate reset
```

---

## 🚀 Running Locally

```bash
# Start everything (web + api)
npm run dev

# Start only the web app
cd apps/web && npm run dev

# Start only the API
cd apps/api && npm run dev

# Build for production
npm run build

# Type check everything
npm run type-check
```

### Default Login Credentials (after seeding)

| Role         | Email                   | Password              |
|--------------|-------------------------|-----------------------|
| Super Admin  | admin@luxedrive.ng      | Admin@LuxeDrive2024   |
| Customer     | test@example.com        | Test@1234             |

---

## 🎯 Feature Guide

### 🚗 Vehicle Catalog
- Filter by brand, transmission, fuel type, seating, price range
- Date-based availability checking
- Featured vehicles on homepage
- SEO-optimized slugs

### 📅 Booking System
- Real-time price calculation (daily / weekly / monthly rates)
- Conflict detection (no double bookings)
- Coupon code support
- Tax (7.5%) + service fee (5%) auto-applied
- Booking reference: `LXD-YYYYMMDD-XXXXXX`

### 💳 Payment (Paystack)
1. Customer creates booking → redirected to Paystack checkout
2. Paystack processes payment in NGN
3. Webhook/verify confirms payment
4. Booking status → `CONFIRMED`
5. Vehicle marked → `RENTED`
6. Loyalty points awarded (1 pt / ₦1,000)
7. Email receipt sent

### 👤 User Dashboard
- Active bookings with vehicle details
- Payment history + receipts
- Loyalty points balance
- Driver's license upload (Cloudinary)
- Saved vehicles (wishlist)
- In-app notifications

### 🛠 Admin Dashboard
- Revenue analytics with charts (Recharts)
- Fleet utilization reports
- Vehicle CRUD with multi-image upload
- Booking approve/reject/manage
- Refund processing
- Coupon management
- Support ticket management
- Site settings control

### 🎁 Loyalty System
- Earn: 1 point per ₦1,000 spent
- Points shown in user dashboard
- Redemption in future (extend as needed)

### 📬 Email Notifications
| Template            | Trigger                        |
|---------------------|--------------------------------|
| `verify-email`      | New registration               |
| `reset-password`    | Forgot password                |
| `booking-received`  | Booking created                |
| `booking-confirmed` | Admin confirms booking         |
| `payment-receipt`   | Payment verified               |
| `pickup-reminder`   | 24hr before pickup (cron job)  |

---

## 📡 API Reference

**Base URL:** `http://localhost:4000/api/v1`

### Authentication

```
POST /auth/register         Create account
POST /auth/login            Get tokens
POST /auth/refresh          Refresh access token
GET  /auth/verify-email/:token  Verify email
POST /auth/forgot-password  Request reset link
POST /auth/reset-password   Reset password
GET  /auth/me               Current user (auth required)
```

### Vehicles

```
GET    /vehicles            List vehicles (with filters)
GET    /vehicles/featured   Featured vehicles
GET    /vehicles/:slug      Vehicle detail
GET    /vehicles/:id/reviews Vehicle reviews
POST   /vehicles/:id/availability Check availability (date range)
POST   /vehicles            Create vehicle (admin)
PUT    /vehicles/:id        Update vehicle (admin)
DELETE /vehicles/:id        Delete vehicle (admin)
POST   /vehicles/:id/images Upload images (admin)
```

### Bookings

```
POST /bookings/calculate-price  Preview price breakdown
POST /bookings                  Create booking
GET  /bookings/my               My bookings
GET  /bookings/:id              Booking detail
POST /bookings/:id/cancel       Cancel booking
GET  /bookings                  All bookings (admin)
POST /bookings/:id/confirm      Confirm booking (admin)
POST /bookings/:id/reject       Reject booking (admin)
```

### Payments

```
POST /payments/initialize       Init Paystack payment
GET  /payments/verify/:reference Verify payment
POST /payments/:id/refund       Issue refund (admin)
```

### Analytics (Admin)

```
GET /analytics/dashboard        Overview stats
GET /analytics/revenue?period=30 Revenue chart data
GET /analytics/fleet-utilization Fleet utilization
```

### Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors:
```json
{
  "success": false,
  "error": "Error message",
  "errors": { "field": "Validation error" }
}
```

---

## 🌐 Deployment

### Frontend — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod
```

**Environment variables to set in Vercel dashboard:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

### Backend — Railway

1. Create a new Railway project
2. Add a **PostgreSQL** database plugin → copy `DATABASE_URL`
3. Add a new service → connect GitHub repo
4. Set **root directory** to `apps/api`
5. Set **start command** to `npm run build && npm start`
6. Add all environment variables from `.env.example`
7. Deploy

### Post-Deploy Checklist

- [ ] Run `npx prisma migrate deploy` on Railway
- [ ] Run seed script for initial data
- [ ] Configure Paystack webhook URL: `https://your-api.railway.app/api/v1/webhooks/paystack`
- [ ] Set `ALLOWED_ORIGINS` to your Vercel domain
- [ ] Enable Cloudinary upload preset
- [ ] Test end-to-end booking flow

---

## 🎨 Customization Guide

### Branding

1. **Company name:** Replace `LuxeDrive` in `.env.example` → `COMPANY_NAME`
2. **Colors:** Edit `apps/web/tailwind.config.ts` → `theme.extend.colors`
3. **Logo:** Replace `public/images/logo.svg`
4. **Fonts:** Update `apps/web/src/app/layout.tsx` Google Fonts import

### Adding Pickup Locations

Edit the `pickupLocations` array in the seed script, or add via Admin Dashboard → Site Settings.

### Adjusting Pricing Logic

In `apps/api/.env`:
```env
BOOKING_TAX_PERCENT=7.5        # VAT rate
BOOKING_SERVICE_FEE_PERCENT=5  # Platform service fee
```

For weekly/monthly discount logic, edit `apps/api/src/controllers/bookings.ts` → `calculatePrice`.

### Currency Change

Change `CURRENCY=NGN` and `CURRENCY_SYMBOL=₦` in `.env`. Paystack supports NGN, GHS, ZAR, KES, USD.

---

## 🔒 Security

| Measure                  | Implementation                              |
|--------------------------|---------------------------------------------|
| Password hashing         | bcrypt, 12 rounds                           |
| Auth tokens              | JWT HS256, 15-min access / 7-day refresh    |
| Rate limiting            | express-rate-limit (100 req/15min globally, 10 req/15min auth) |
| CSRF                     | SameSite cookies + CORS whitelist           |
| XSS                      | Helmet.js security headers                 |
| Input validation         | Zod schemas on all endpoints                |
| SQL injection            | Prisma parameterized queries                |
| Webhook verification     | HMAC-SHA512 Paystack signature check        |
| File upload safety       | Multer + Cloudinary (no local file storage) |
| Admin route protection   | `requireRole('ADMIN', 'SUPER_ADMIN')` middleware |

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd apps/api && npx prisma generate
```

### Database connection refused
- Check `DATABASE_URL` in `apps/api/.env`
- Ensure PostgreSQL is running locally or Railway service is up

### Paystack payment not working
- Verify you're using **live keys** for production
- Check webhook URL is correctly set in Paystack dashboard
- Use **test keys** + test cards for development:
  - Card: `4084 0840 8408 4081`  CVV: `408`  PIN: `0000`  OTP: `123456`

### Email not sending
- Check SMTP credentials
- For Resend.com: verify your domain first
- In development, use [Mailtrap.io](https://mailtrap.io) as SMTP

### Images not uploading
- Verify Cloudinary credentials
- Check the upload preset is set to **unsigned** in Cloudinary settings

---

## 📄 License

© 2024 LuxeDrive. All rights reserved.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

*Built with ♥ for the Nigerian luxury market*
