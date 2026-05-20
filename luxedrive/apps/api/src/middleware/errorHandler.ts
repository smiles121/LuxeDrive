import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  let statusCode = err.statusCode || 500
  let message    = err.message    || 'Internal server error'

  // Prisma unique constraint
  if (err.code === 'P2002') {
    statusCode = 409
    message    = `A record with this ${err.meta?.target?.[0] || 'value'} already exists.`
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404
    message    = 'Record not found.'
  }

  // Validation errors
  if (err.name === 'ZodError') {
    statusCode = 422
    const errors: Record<string, string> = {}
    err.errors.forEach((e: any) => {
      errors[e.path.join('.')] = e.message
    })
    return res.status(422).json({ success: false, error: 'Validation failed', errors })
  }

  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    console.error('💥 Unhandled Error:', err)
  }

  res.status(statusCode).json({
    success: false,
    error:   message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error:   `Route ${req.method} ${req.url} not found`,
  })
}
