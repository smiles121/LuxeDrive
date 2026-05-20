# ─────────────────────────────────────────────
# LuxeDrive — Environment Variables Template
# Copy this file to .env and fill in your values
# NEVER commit .env to version control
# ─────────────────────────────────────────────

# ── APP ──────────────────────────────────────
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000

# ── DATABASE ─────────────────────────────────
# Get from Railway → luxedrive-db → Connect
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/luxedrive?schema=public"

# ── JWT AUTH ─────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_min_64_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_64_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── PAYSTACK ─────────────────────────────────
# Get from https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

# ── STRIPE (optional, for international) ─────
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# ── CLOUDINARY ───────────────────────────────
# Get from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=luxedrive_uploads

# ── EMAIL (NodeMailer via SMTP) ───────────────
# Recommended: Resend.com or Brevo (free tier)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@luxedrive.ng
EMAIL_FROM_NAME=LuxeDrive

# ── SMS — TWILIO ─────────────────────────────
# Get from https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ── REDIS (for queues & caching) ─────────────
# Get from Railway Redis plugin
REDIS_URL=redis://default:password@host:6379

# ── GOOGLE MAPS ──────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── SECURITY ─────────────────────────────────
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ── CORS ─────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,https://luxedrive.ng,https://www.luxedrive.ng

# ── BUSINESS ─────────────────────────────────
COMPANY_NAME=LuxeDrive
COMPANY_EMAIL=hello@luxedrive.ng
COMPANY_PHONE=+2348000000000
COMPANY_ADDRESS="Lagos, Nigeria"
BOOKING_SERVICE_FEE_PERCENT=5
BOOKING_TAX_PERCENT=7.5
BOOKING_MIN_HOURS=24
CURRENCY=NGN
CURRENCY_SYMBOL=₦

# ─── NEXT.JS (web app) ───────────────────────
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
