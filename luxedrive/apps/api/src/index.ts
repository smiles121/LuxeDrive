// ─────────────────────────────────────────────────────────────
// LuxeDrive API — Entry Point
// ─────────────────────────────────────────────────────────────

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { requestLogger } from './middleware/requestLogger'

// ── Routes ──────────────────────────────────
import authRoutes      from './routes/auth'
import userRoutes      from './routes/users'
import vehicleRoutes   from './routes/vehicles'
import bookingRoutes   from './routes/bookings'
import paymentRoutes   from './routes/payments'
import scheduleRoutes  from './routes/schedules'
import reviewRoutes    from './routes/reviews'
import couponRoutes    from './routes/coupons'
import notifRoutes     from './routes/notifications'
import ticketRoutes    from './routes/tickets'
import analyticsRoutes from './routes/analytics'
import adminRoutes     from './routes/admin'
import webhookRoutes   from './routes/webhooks'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ── Security Middleware ──────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.paystack.co"],
      connectSrc: ["'self'", "https://api.paystack.co"],
    },
  },
}))

// ── CORS ─────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}))

// ── General Middleware ───────────────────────
app.use(compression())
app.use(morgan('combined'))
app.use(requestLogger)

// ── Body Parsing — NOTE: webhooks need raw body ──
app.use('/api/webhooks', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Global Rate Limiting ─────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
})
app.use('/api/', limiter)

// ── Stricter limiter for auth routes ─────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts. Please wait 15 minutes.' },
})

// ── Health Check ─────────────────────────────
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'LuxeDrive API',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ───────────────────────────────
const API = '/api/v1'

app.use(`${API}/webhooks`,     webhookRoutes)
app.use(`${API}/auth`,         authLimiter, authRoutes)
app.use(`${API}/users`,        userRoutes)
app.use(`${API}/vehicles`,     vehicleRoutes)
app.use(`${API}/bookings`,     bookingRoutes)
app.use(`${API}/payments`,     paymentRoutes)
app.use(`${API}/schedules`,    scheduleRoutes)
app.use(`${API}/reviews`,      reviewRoutes)
app.use(`${API}/coupons`,      couponRoutes)
app.use(`${API}/notifications`,notifRoutes)
app.use(`${API}/tickets`,      ticketRoutes)
app.use(`${API}/analytics`,    analyticsRoutes)
app.use(`${API}/admin`,        adminRoutes)

// ── 404 & Error Handling ─────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║       🚗  LuxeDrive API Server        ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Environment: ${process.env.NODE_ENV?.padEnd(22)}║
  ╚═══════════════════════════════════════╝
  `)
})

export default app
