// ─────────────────────────────────────────────
// LuxeDrive API — Payments Controller (Paystack)
// ─────────────────────────────────────────────

import { Request, Response } from 'express'
import axios from 'axios'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendEmail } from '../services/email'
import { createNotification } from '../services/notifications'

const PAYSTACK_SECRET  = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE    = 'https://api.paystack.co'
const CURRENCY_SYMBOL  = process.env.CURRENCY_SYMBOL || '₦'

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json',
}

/**
 * POST /payments/initialize
 * Initialize a Paystack payment for a booking
 */
export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id
  const { bookingId } = req.body

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, vehicle: true },
  })

  if (!booking) throw new AppError('Booking not found.', 404)
  if (booking.userId !== userId) throw new AppError('Access denied.', 403)
  if (booking.status === 'CANCELLED') throw new AppError('Cannot pay for a cancelled booking.', 400)

  // Check if already paid
  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } })
  if (existingPayment?.status === 'PAID') {
    throw new AppError('This booking has already been paid for.', 400)
  }

  // Amount in kobo (NGN smallest unit)
  const amountKobo = Math.round(Number(booking.totalAmount) * 100)

  const paystackRes = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email:      booking.user.email,
      amount:     amountKobo,
      currency:   'NGN',
      reference:  `${booking.reference}-${Date.now()}`,
      callback_url: `${process.env.WEB_URL}/bookings/${booking.id}/payment/callback`,
      metadata: {
        bookingId:   booking.id,
        bookingRef:  booking.reference,
        userId,
        vehicleTitle: booking.vehicle.title,
        custom_fields: [
          { display_name: 'Booking Reference', variable_name: 'booking_ref', value: booking.reference },
          { display_name: 'Vehicle',           variable_name: 'vehicle',     value: booking.vehicle.title },
        ],
      },
    },
    { headers: paystackHeaders },
  )

  const { data } = paystackRes.data

  // Upsert a pending payment record
  await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      userId,
      amount:       booking.totalAmount,
      currency:     'NGN',
      method:       'PAYSTACK',
      status:       'PENDING',
      paystackRef:  data.reference,
    },
    update: {
      paystackRef: data.reference,
      status:      'PENDING',
    },
  })

  res.json({
    success: true,
    data: {
      authorizationUrl: data.authorization_url,
      accessCode:       data.access_code,
      reference:        data.reference,
    },
  })
})

/**
 * POST /payments/verify
 * Verify a Paystack payment after redirect
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params

  const paystackRes = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    { headers: paystackHeaders },
  )

  const txData = paystackRes.data.data

  if (txData.status !== 'success') {
    throw new AppError(`Payment ${txData.status}. Please try again.`, 400)
  }

  const { bookingId } = txData.metadata

  const payment = await prisma.payment.findFirst({
    where: { paystackRef: reference },
    include: { booking: { include: { user: true, vehicle: true } } },
  })

  if (!payment) throw new AppError('Payment record not found.', 404)
  if (payment.status === 'PAID') {
    return res.json({ success: true, message: 'Payment already verified.', data: { payment } })
  }

  // Update payment
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status:       'PAID',
      paystackTxId: String(txData.id),
      paidAt:       new Date(),
      metadata:     txData,
    },
  })

  // Confirm the booking
  await prisma.booking.update({
    where: { id: bookingId },
    data:  { status: 'CONFIRMED' },
  })

  // Mark vehicle as rented
  await prisma.vehicle.update({
    where: { id: payment.booking.vehicleId },
    data:  { status: 'RENTED' },
  })

  // Award loyalty points (1 point per ₦1,000 spent)
  const pointsEarned = Math.floor(Number(payment.amount) / 1000)
  await prisma.user.update({
    where: { id: payment.userId },
    data:  { loyaltyPoints: { increment: pointsEarned } },
  })
  await prisma.loyaltyTransaction.create({
    data: {
      userId:      payment.userId,
      points:      pointsEarned,
      type:        'EARN',
      description: `Points for booking #${payment.booking.reference}`,
      bookingId,
    },
  })

  // Notify user
  await createNotification({
    userId:  payment.userId,
    type:    'PAYMENT_RECEIVED',
    title:   'Payment Successful!',
    message: `Payment of ${CURRENCY_SYMBOL}${Number(payment.amount).toLocaleString()} for booking #${payment.booking.reference} confirmed.`,
    data:    { bookingId, paymentId: payment.id },
  })

  // Send receipt email
  await sendEmail({
    to:       payment.booking.user.email,
    subject:  `LuxeDrive — Payment Receipt #${payment.booking.reference}`,
    template: 'payment-receipt',
    data: {
      firstName:     payment.booking.user.firstName,
      reference:     payment.booking.reference,
      vehicleTitle:  payment.booking.vehicle.title,
      amount:        `${CURRENCY_SYMBOL}${Number(payment.amount).toLocaleString()}`,
      transactionId: txData.id,
      paidAt:        new Date().toLocaleString('en-NG'),
      pointsEarned,
    },
  })

  res.json({
    success: true,
    message: 'Payment verified successfully.',
    data: { payment: updatedPayment },
  })
})

/**
 * POST /webhooks/paystack
 * Paystack webhook handler
 */
export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex')

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const { event, data } = req.body

  switch (event) {
    case 'charge.success':
      // Already handled by verify endpoint; idempotent check
      const payment = await prisma.payment.findFirst({
        where: { paystackRef: data.reference },
      })
      if (payment && payment.status !== 'PAID') {
        await prisma.payment.update({
          where: { id: payment.id },
          data:  { status: 'PAID', paidAt: new Date(), paystackTxId: String(data.id) },
        })
      }
      break

    case 'refund.processed':
      await prisma.payment.updateMany({
        where: { paystackRef: data.transaction_reference },
        data: {
          status:        'REFUNDED',
          refundedAt:    new Date(),
          refundAmount:  data.amount / 100,
        },
      })
      break
  }

  res.sendStatus(200)
})

/**
 * POST /payments/:id/refund — Admin
 */
export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { reason, amount } = req.body

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { booking: { include: { user: true } } },
  })

  if (!payment) throw new AppError('Payment not found.', 404)
  if (payment.status !== 'PAID') throw new AppError('Only paid payments can be refunded.', 400)

  const refundAmountKobo = amount
    ? Math.round(amount * 100)
    : Math.round(Number(payment.amount) * 100)

  await axios.post(
    `${PAYSTACK_BASE}/refund`,
    {
      transaction:    payment.paystackRef || payment.paystackTxId,
      amount:         refundAmountKobo,
      customer_note:  reason,
      merchant_note:  reason,
    },
    { headers: paystackHeaders },
  )

  const isPartial = refundAmountKobo < Math.round(Number(payment.amount) * 100)

  await prisma.payment.update({
    where: { id },
    data: {
      status:        isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
      refundedAt:    new Date(),
      refundAmount:  refundAmountKobo / 100,
      refundReason:  reason,
    },
  })

  await createNotification({
    userId:  payment.userId,
    type:    'PAYMENT_RECEIVED',
    title:   'Refund Processed',
    message: `A refund of ${CURRENCY_SYMBOL}${(refundAmountKobo / 100).toLocaleString()} has been initiated for booking #${payment.booking.reference}.`,
    data:    { bookingId: payment.bookingId, paymentId: payment.id },
  })

  res.json({ success: true, message: 'Refund initiated successfully.' })
})
