// ─────────────────────────────────────────────
// LuxeDrive API — Vehicle Routes
// ─────────────────────────────────────────────

import { Router } from 'express'
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  checkAvailability,
  getFeaturedVehicles,
  getVehicleReviews,
} from '../controllers/vehicles'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { uploadImages } from '../middleware/upload'
import { validate } from '../middleware/validate'
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicles'

const router = Router()

// Public
router.get('/',                    listVehicles)
router.get('/featured',            getFeaturedVehicles)
router.get('/:slug',               getVehicle)
router.get('/:id/reviews',         getVehicleReviews)
router.post('/:id/availability',   checkAvailability)

// Admin only
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validate(createVehicleSchema),
  createVehicle,
)
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  validate(updateVehicleSchema),
  updateVehicle,
)
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  deleteVehicle,
)
router.post(
  '/:id/images',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  uploadImages.array('images', 10),
  uploadVehicleImages,
)

export default router
