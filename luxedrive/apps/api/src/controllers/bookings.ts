// ─────────────────────────────────────────────
// LuxeDrive API — Bookings Controller
// ─────────────────────────────────────────────

import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendEmail } from '../services/email'
import { createNotification } from '../services/notifications'
import { differenceInDays, parseISO, isBefore } from 'date-fns'

const TAX_RATE         = parseFloat(process.env.BOOKING_TAX_PERCENT    || '7.5') / 100
const SERVICE_FEE_RATE = parseFloat(process.env.BOOKING_SERVICE_FEE_PERCENT || '5') / 100
const CURRENCY_SYMBOL  = process.env.CURRENCY_SYMBOL || '₦'

// Generate booking reference: LXD-YYYYMMDD-XXXXXX
function generateReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `LXD-${date}-${rand}`
}

/**
 * POST /bookings/calculate-price
 */
export const calculatePrice = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId, pickupDate, dropoffDate, couponCode } = req.body

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
  if (!vehicle) throw new AppError('Vehicle not found.', 404)

  const pickup  = parseISO(pickupDate)
  const dropoff = parseISO(dropoffDate)

  if (isBefore(dropoff, pickup)) throw new AppError('Dropoff must be after pickup.', 400)

  const rentalDays = Math.max(1, differenceInDays(dropoff, pickup))

  // Price logic: apply weekly/monthly discounts if applicable
  let baseAmount: number
  if (rentalDays >= 30 && vehicle.monthlyPrice) {
    const months = rentalDays / 30
    baseAmount = Math.round(Number(vehicle.monthlyPrice) * months)
  } else if (rentalDays >= 7 && vehicle.weeklyPrice) {
    const weeks = rentalDays / 7
    baseAmount = Math.round(Number(vehicle.weeklyPrice) * weeks)
  } else {
    baseAmount = Number(vehicle.dailyPrice) * rentalDays
  }

  const taxAmount  = Math.round(baseAmount * TAX_RATE)
  const serviceFee = Math.round(baseAmount * SERVICE_FEE_RATE)

  let discountAmount = 0
  let couponDiscount = 0
  let couponId: string | undefined

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        OR: [{ usageLimit: null }, { usedCount: { lt: prisma.coupon.fields.usageLimit } }],
      },
    })

    if (!coupon) throw new AppError('Invalid or expired coupon code.', 400)

    if (coupon.minBookingValue && baseAmount < Number(coupon.minBookingValue)) {
      throw new AppError(
        `Minimum booking value for this coupon is ${CURRENCY_SYMBOL}${coupon.minBookingValue.toLocaleString()}.`,
        400,
      )
    }

    if (coupon.discountType === 'PERCENTAGE') {
      couponDiscount = Math.round((baseAmount * Number(coupon.discountValue)) / 100)
      if (coupon.maxDiscount) {
        couponDiscount = Math.min(couponDiscount, Number(coupon.maxDiscount))
      }
    } else {
      couponDiscount = Number(coupon.discountValue)
    }

    discountAmount = couponDiscount
    couponId = coupon.id
  }

  const totalAmount = baseAmount + taxAmount + serviceFee - discountAmount

  res.json({
    success: true,
    data: {
      rentalDays,
      dailyRate:      Number(vehicle.dailyPrice),
      baseAmount,
      taxRate:        TAX_RATE,
      taxAmount,
      serviceFeeRate: SERVICE_FEE_RATE,
      serviceFee,
      discountAmount,
      couponDiscount,
      couponId,
      totalAmount,
      currency: 'NGN',
    },
  })
})

/**
 * POST /bookings
 */
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const {
    vehicleId,
    pickupDate,
    dropoffDate,
    pickupLocation,
    dropoffLocation,
    couponCode,
    notes,
  } = req.body

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
  if (!vehicle) throw new AppError('Vehicle not found.', 404)
  if (vehicle.status !== 'AVAILABLE') throw new AppError('This vehicle is not available for booking.', 400)

  // Check for conflicting bookings
  const pickup  = parseISO(pickupDate)
  const dropoff = parseISO(dropoffDate)

  const conflict = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      OR: [
        { pickupDate: { lte: dropoff }, dropoffDate: { gte: pickup } },
      ],
    },
  })

  if (conflict) throw new AppError('This vehicle is already booked for the selected dates.', 409)

  const rentalDays = Math.max(1, differenceInDays(dropoff, pickup))

  // Calculate price
  let baseAmount: number
  if (rentalDays >= 30 && vehicle.monthlyPrice) {
    baseAmount = Math.round(Number(vehicle.monthlyPrice) * (rentalDays / 30))
  } else if (rentalDays >= 7 && vehicle.weeklyPrice) {
    baseAmount = Math.round(Number(vehicle.weeklyPrice) * (rentalDays / 7))
  } else {
    baseAmount = Number(vehicle.dailyPrice) * rentalDays
  }

  const taxAmount  = Math.round(baseAmount * TAX_RATE)
  const serviceFee = Math.round(baseAmount * SERVICE_FEE_RATE)

  let discountAmount = 0
  let couponId: string | undefined

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode.toUpperCase(), isActive: true },
    })
    if (coupon) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.round((baseAmount * Number(coupon.discountValue)) / 100)
        if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount))
      } else {
        discountAmount = Number(coupon.discountValue)
      }
      couponId = coupon.id
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
    }
  }

  const totalAmount = baseAmount + taxAmount + serviceFee - discountAmount
  const reference   = generateReference()

  const booking = await prisma.booking.create({
    data: {
      reference,
      userId,
      vehicleId,
      pickupDate:      pickup,
      dropoffDate:     dropoff,
      pickupLocation,
      dropoffLocation,
      rentalDays,
      baseAmount,
      taxAmount,
      serviceFee,
      discountAmount,
      totalAmount,
      couponId,
      notes,
      status: 'PENDING',
    },
    include: {
      vehicle: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      user:    true,
    },
  })

  // Notify customer
  await createNotification({
    userId,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Received',
    message: `Your booking #${reference} has been received and is pending confirmation.`,
    data: { bookingId: booking.id },
  })

  // Send confirmation email
  await sendEmail({
    to: booking.user.email,
    subject: `LuxeDrive — Booking #${reference} Received`,
    template: 'booking-received',
    data: {
      firstName:      booking.user.firstName,
      reference,
      vehicleTitle:   booking.vehicle.title,
      pickupDate:     pickup.toLocaleDateString('en-NG'),
      dropoffDate:    dropoff.toLocaleDateString('en-NG'),
      pickupLocation,
      totalAmount:    `${CURRENCY_SYMBOL}${totalAmount.toLocaleString()}`,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Booking created successfully. Proceed to payment to confirm.',
    data: { booking },
  })
})

/**
 * GET /bookings/my
 */
export const getUserBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const { status, page = 1, limit = 10 } = req.query as any

  const where: any = { userId }
  if (status) where.status = status

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        vehicle: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.booking.count({ where }),
  ])

  res.json({
    success: true,
    data: {
      bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  })
})

/**
 * GET /bookings/:id
 */
export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const role   = (req as any).user.role
  const { id } = req.params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      vehicle:   { include: { images: true } },
      user:      true,
      payment:   true,
      schedules: true,
      review:    true,
    },
  })

  if (!booking) throw new AppError('Booking not found.', 404)

  // Users can only view their own bookings
  if (role === 'CUSTOMER' && booking.userId !== userId) {
    throw new AppError('Access denied.', 403)
  }

  res.json({ success: true, data: { booking } })
})

/**
 * POST /bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const { id } = req.params
  const { reason } = req.body

  const booking = await prisma.booking.findUnique({ where: { id }, include: { user: true } })
  if (!booking) throw new AppError('Booking not found.', 404)
  if (booking.userId !== userId) throw new AppError('Access denied.', 403)

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new AppError('This booking cannot be cancelled.', 400)
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status:             'CANCELLED',
      cancellationReason: reason,
      cancelledAt:        new Date(),
    },
  })

  await createNotification({
    userId,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: `Your booking #${booking.reference} has been cancelled.`,
    data: { bookingId: booking.id },
  })

  res.json({ success: true, message: 'Booking cancelled successfully.' })
})

/**
 * GET /bookings — Admin
 */
export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const { status, userId, vehicleId, page = 1, limit = 20, search } = req.query as any

  const where: any = {}
  if (status)    where.status    = status
  if (userId)    where.userId    = userId
  if (vehicleId) where.vehicleId = vehicleId
  if (search) {
    where.OR = [
      { reference:     { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, email: true } },
        vehicle: { select: { id: true, title: true, brand: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
    prisma.booking.count({ where }),
  ])

  res.json({
    success: true,
    data: {
      bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  })
})

/**
 * POST /bookings/:id/confirm — Admin
 */
export const confirmBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { adminNotes } = req.body

  const booking = await prisma.booking.findUnique({ where: { id }, include: { user: true } })
  if (!booking) throw new AppError('Booking not found.', 404)

  await prisma.booking.update({
    where: { id },
    data: { status: 'CONFIRMED', adminNotes },
  })

  await prisma.vehicle.update({
    where: { id: booking.vehicleId },
    data: { status: 'RENTED' },
  })

  await createNotification({
    userId:  booking.userId,
    type:    'BOOKING_CONFIRMED',
    title:   'Booking Confirmed!',
    message: `Your booking #${booking.reference} has been confirmed.`,
    data:    { bookingId: booking.id },
  })

  res.json({ success: true, message: 'Booking confirmed.' })
})

/**
 * POST /bookings/:id/reject — Admin
 */
export const rejectBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { reason } = req.body

  const booking = await prisma.booking.findUnique({ where: { id }, include: { user: true } })
  if (!booking) throw new AppError('Booking not found.', 404)

  await prisma.booking.update({
    where: { id },
    data: { status: 'REJECTED', adminNotes: reason },
  })

  await createNotification({
    userId:  booking.userId,
    type:    'BOOKING_CANCELLED',
    title:   'Booking Rejected',
    message: `Your booking #${booking.reference} was not approved. Reason: ${reason}`,
    data:    { bookingId: booking.id },
  })

  res.json({ success: true, message: 'Booking rejected.' })
})
