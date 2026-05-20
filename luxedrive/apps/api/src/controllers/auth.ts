// ─────────────────────────────────────────────
// LuxeDrive API — Auth Controller
// ─────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../config/prisma'
import { sendEmail } from '../services/email'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'

const BCRYPT_ROUNDS  = parseInt(process.env.BCRYPT_ROUNDS  || '12')
const JWT_SECRET     = process.env.JWT_SECRET!
const JWT_REFRESH    = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRES    = process.env.JWT_EXPIRES_IN    || '15m'
const JWT_REFRESH_EX = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
const WEB_URL        = process.env.WEB_URL || 'http://localhost:3000'

// ── Helpers ──────────────────────────────────

function signToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_REFRESH, { expiresIn: JWT_REFRESH_EX })
}

function safeUser(user: any) {
  const { passwordHash, emailVerifyToken, passwordResetToken, passwordResetExpiry, ...safe } = user
  return { ...safe, fullName: `${user.firstName} ${user.lastName}` }
}

// ── Controllers ───────────────────────────────

/**
 * POST /auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw new AppError('An account with this email already exists.', 409)

  const passwordHash     = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const emailVerifyToken = uuidv4()
  const referralCode     = `LXD-${uuidv4().slice(0, 8).toUpperCase()}`

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      emailVerifyToken,
      referralCode,
    },
  })

  // Send verification email
  await sendEmail({
    to: email,
    subject: 'Welcome to LuxeDrive — Verify Your Email',
    template: 'verify-email',
    data: {
      firstName,
      verifyUrl: `${WEB_URL}/auth/verify-email?token=${emailVerifyToken}`,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your account.',
    data: { user: safeUser(user) },
  })
})

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError('Invalid email or password.', 401)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError('Invalid email or password.', 401)

  if (user.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended. Please contact support.', 403)
  }

  const token        = signToken(user.id, user.role)
  const refreshToken = signRefreshToken(user.id)

  res.json({
    success: true,
    data: {
      user: safeUser(user),
      token,
      refreshToken,
    },
  })
})

/**
 * POST /auth/logout
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // With stateless JWT, logout is handled client-side.
  // If using refresh token blocklist (Redis), invalidate here.
  res.json({ success: true, message: 'Logged out successfully.' })
})

/**
 * POST /auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body
  if (!token) throw new AppError('Refresh token is required.', 400)

  let payload: any
  try {
    payload = jwt.verify(token, JWT_REFRESH)
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new AppError('User not found.', 401)

  const newToken        = signToken(user.id, user.role)
  const newRefreshToken = signRefreshToken(user.id)

  res.json({
    success: true,
    data: { token: newToken, refreshToken: newRefreshToken },
  })
})

/**
 * GET /auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } })
  if (!user) throw new AppError('Invalid or expired verification token.', 400)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      status: 'ACTIVE',
    },
  })

  res.json({ success: true, message: 'Email verified successfully. You can now log in.' })
})

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  // Always respond with success to prevent email enumeration
  if (user) {
    const resetToken  = uuidv4()
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
    })

    await sendEmail({
      to: email,
      subject: 'LuxeDrive — Reset Your Password',
      template: 'reset-password',
      data: {
        firstName: user.firstName,
        resetUrl: `${WEB_URL}/auth/reset-password?token=${resetToken}`,
        expiryMinutes: 60,
      },
    })
  }

  res.json({
    success: true,
    message: 'If an account exists with that email, you will receive a reset link shortly.',
  })
})

/**
 * POST /auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  })

  if (!user) throw new AppError('Invalid or expired reset token.', 400)

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  })

  res.json({ success: true, message: 'Password reset successfully. Please log in.' })
})

/**
 * GET /auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    include: {
      _count: {
        select: { bookings: true, reviews: true },
      },
    },
  })

  if (!user) throw new AppError('User not found.', 404)

  res.json({ success: true, data: { user: safeUser(user) } })
})
