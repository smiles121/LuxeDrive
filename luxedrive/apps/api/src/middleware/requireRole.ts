import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user
    if (!user) return next(new AppError('Authentication required.', 401))
    if (!roles.includes(user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403))
    }
    next()
  }
}
