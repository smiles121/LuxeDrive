// ─────────────────────────────────────────────
// LuxeDrive API — Analytics Controller
// ─────────────────────────────────────────────

import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { asyncHandler } from '../utils/asyncHandler'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

/**
 * GET /analytics/dashboard — Admin overview stats
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const now      = new Date()
  const today    = startOfDay(now)
  const last30   = subDays(today, 30)
  const prev30   = subDays(today, 60)

  const [
    totalRevenue,
    prevRevenue,
    totalBookings,
    prevBookings,
    newUsers,
    prevUsers,
    activeRentals,
    vehicleStats,
    avgRating,
  ] = await Promise.all([
    // Revenue last 30 days
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', paidAt: { gte: last30 } },
    }),
    // Revenue prev 30 days
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', paidAt: { gte: prev30, lt: last30 } },
    }),
    // Bookings last 30 days
    prisma.booking.count({ where: { createdAt: { gte: last30 } } }),
    // Bookings prev 30 days
    prisma.booking.count({ where: { createdAt: { gte: prev30, lt: last30 } } }),
    // New users last 30 days
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    // New users prev 30 days
    prisma.user.count({ where: { createdAt: { gte: prev30, lt: last30 } } }),
    // Active rentals
    prisma.booking.count({ where: { status: 'ACTIVE' } }),
    // Vehicle stats
    prisma.vehicle.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    // Average rating
    prisma.review.aggregate({ _avg: { rating: true } }),
  ])

  const growth = (curr: number, prev: number) =>
    prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100)

  const totalRevenueVal = Number(totalRevenue._sum.amount || 0)
  const prevRevenueVal  = Number(prevRevenue._sum.amount  || 0)

  const vehicleMap = vehicleStats.reduce((acc, v) => {
    acc[v.status] = v._count.id
    return acc
  }, {} as Record<string, number>)

  res.json({
    success: true,
    data: {
      totalRevenue:     totalRevenueVal,
      revenueGrowth:    growth(totalRevenueVal, prevRevenueVal),
      totalBookings,
      bookingsGrowth:   growth(totalBookings, prevBookings),
      activeRentals,
      totalVehicles:    Object.values(vehicleMap).reduce((a, b) => a + b, 0),
      availableVehicles: vehicleMap['AVAILABLE'] || 0,
      newUsers,
      usersGrowth:      growth(newUsers, prevUsers),
      avgRating:        Number(avgRating._avg.rating?.toFixed(1) || 0),
    },
  })
})

/**
 * GET /analytics/revenue?period=30
 * Daily revenue chart data
 */
export const getRevenueData = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt((req.query.period as string) || '30')
  const from = subDays(new Date(), days)

  const payments = await prisma.payment.findMany({
    where: { status: 'PAID', paidAt: { gte: from } },
    select: { amount: true, paidAt: true },
    orderBy: { paidAt: 'asc' },
  })

  // Group by day
  const map = new Map<string, { revenue: number; bookings: number }>()

  for (let i = days; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    map.set(d, { revenue: 0, bookings: 0 })
  }

  payments.forEach(p => {
    if (!p.paidAt) return
    const d = format(p.paidAt, 'yyyy-MM-dd')
    if (map.has(d)) {
      const entry = map.get(d)!
      entry.revenue  += Number(p.amount)
      entry.bookings += 1
    }
  })

  const data = Array.from(map.entries()).map(([date, v]) => ({ date, ...v }))

  res.json({ success: true, data })
})

/**
 * GET /analytics/fleet-utilization
 */
export const getFleetUtilization = asyncHandler(async (_req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      title: true,
      brand: true,
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { in: ['COMPLETED', 'ACTIVE'] } },
        select: { rentalDays: true, totalAmount: true },
      },
    },
  })

  const data = vehicles.map(v => {
    const totalRevenue  = v.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const totalRentalDays = v.bookings.reduce((sum, b) => sum + b.rentalDays, 0)
    const utilizationRate = Math.min(100, Math.round((totalRentalDays / 30) * 100))

    return {
      vehicleId:       v.id,
      title:           v.title,
      totalBookings:   v._count.bookings,
      totalRevenue,
      utilizationRate,
    }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)

  res.json({ success: true, data })
})
