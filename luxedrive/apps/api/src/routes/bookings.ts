// ─────────────────────────────────────────────
// LuxeDrive API — Booking Routes
// ─────────────────────────────────────────────

import { Router } from 'express'
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBooking,
  confirmBooking,
  rejectBooking,
  calculatePrice,
  getUserBookings,
} from '../controllers/bookings'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { validate } from '../middleware/validate'
import { createBookingSchema } from '../validators/bookings'

const router = Router()

// All routes require auth
router.use(authenticate)

// Customer routes
router.post('/',                  validate(createBookingSchema), createBooking)
router.post('/calculate-price',   calculatePrice)
router.get('/my',                 getUserBookings)
router.get('/:id',                getBooking)
router.post('/:id/cancel',        cancelBooking)

// Admin routes
router.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), listBookings)
router.post('/:id/confirm', requireRole('ADMIN', 'SUPER_ADMIN'), confirmBooking)
router.post('/:id/reject',  requireRole('ADMIN', 'SUPER_ADMIN'), rejectBooking)

export default router
