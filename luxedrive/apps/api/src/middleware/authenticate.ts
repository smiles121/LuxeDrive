// ─────────────────────────────────────────────
// LuxeDrive API — Authenticate Middleware
// ─────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError'
import { prisma } from '../config/prisma'

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401)
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: string }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, firstName: true, lastName: true },
    })

    if (!user) throw new AppError('User not found.', 401)
    if (user.status === 'SUSPENDED') throw new AppError('Account suspended.', 403)

    ;(req as any).user = user
    next()
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token.', 401))
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired.', 401))
    next(err)
  }
}
