// ─────────────────────────────────────────────
// LuxeDrive API — Auth Routes
// POST /api/v1/auth/*
// ─────────────────────────────────────────────

import { Router } from 'express'
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/auth'
import { authenticate } from '../middleware/authenticate'
import { validate } from '../middleware/validate'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth'

const router = Router()

router.post('/register',        validate(registerSchema),       register)
router.post('/login',           validate(loginSchema),          login)
router.post('/logout',          authenticate,                   logout)
router.post('/refresh',                                         refreshToken)
router.get( '/verify-email/:token',                            verifyEmail)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password',  validate(resetPasswordSchema),  resetPassword)
router.get( '/me',              authenticate,                   getMe)

export default router
