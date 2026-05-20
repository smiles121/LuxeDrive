// ─────────────────────────────────────────────────────────────
// LuxeDrive — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

// ── ENUMS ─────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE'
export type TransmissionType = 'AUTOMATIC' | 'MANUAL'
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type PaymentMethod = 'PAYSTACK' | 'STRIPE' | 'BANK_TRANSFER' | 'CASH'
export type DiscountType = 'PERCENTAGE' | 'FIXED'

// ── USER ──────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string
  emailVerified: boolean
  phoneVerified: boolean
  driverLicenseUrl?: string
  driverLicenseVerified: boolean
  loyaltyPoints: number
  referralCode?: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser extends User {
  token: string
  refreshToken: string
}

// ── VEHICLE ───────────────────────────────────────────────────

export interface VehicleImage {
  id: string
  url: string
  publicId: string
  isPrimary: boolean
  order: number
}

export interface Vehicle {
  id: string
  title: string
  brand: string
  model: string
  year: number
  slug: string
  description: string
  transmission: TransmissionType
  fuelType: FuelType
  seatingCapacity: number
  dailyPrice: number
  weeklyPrice?: number
  monthlyPrice?: number
  status: VehicleStatus
  hasGPS: boolean
  hasInsurance: boolean
  insuranceDetails?: string
  color?: string
  licensePlate?: string
  mileage?: number
  features: string[]
  pickupLocations: string[]
  isFeatured: boolean
  images: VehicleImage[]
  primaryImage?: string
  averageRating?: number
  reviewCount?: number
  createdAt: string
  updatedAt: string
}

export interface VehicleFilters {
  brand?: string
  transmission?: TransmissionType
  fuelType?: FuelType
  seatingCapacity?: number
  minPrice?: number
  maxPrice?: number
  status?: VehicleStatus
  features?: string[]
  pickupDate?: string
  dropoffDate?: string
  pickupLocation?: string
  search?: string
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
}

// ── BOOKING ───────────────────────────────────────────────────

export interface Booking {
  id: string
  reference: string
  userId: string
  user?: User
  vehicleId: string
  vehicle?: Vehicle
  status: BookingStatus
  pickupDate: string
  dropoffDate: string
  pickupLocation: string
  dropoffLocation: string
  rentalDays: number
  baseAmount: number
  taxAmount: number
  serviceFee: number
  discountAmount: number
  totalAmount: number
  couponId?: string
  notes?: string
  adminNotes?: string
  cancellationReason?: string
  cancelledAt?: string
  driverAssigned?: string
  payment?: Payment
  createdAt: string
  updatedAt: string
}

export interface BookingRequest {
  vehicleId: string
  pickupDate: string
  dropoffDate: string
  pickupLocation: string
  dropoffLocation: string
  couponCode?: string
  notes?: string
}

export interface BookingPriceBreakdown {
  rentalDays: number
  dailyRate: number
  baseAmount: number
  taxRate: number
  taxAmount: number
  serviceFeeRate: number
  serviceFee: number
  discountAmount: number
  couponDiscount: number
  totalAmount: number
}

// ── PAYMENT ───────────────────────────────────────────────────

export interface Payment {
  id: string
  bookingId: string
  userId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  paystackRef?: string
  stripePaymentId?: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
  refundReason?: string
  receiptUrl?: string
  createdAt: string
  updatedAt: string
}

// ── COUPON ────────────────────────────────────────────────────

export interface Coupon {
  id: string
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minBookingValue?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

// ── REVIEW ────────────────────────────────────────────────────

export interface Review {
  id: string
  bookingId: string
  userId: string
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>
  vehicleId: string
  rating: number
  title?: string
  body: string
  isPublished: boolean
  adminReply?: string
  createdAt: string
}

// ── NOTIFICATION ──────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

// ── SUPPORT TICKET ────────────────────────────────────────────

export interface SupportTicket {
  id: string
  userId: string
  user?: User
  subject: string
  message: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?: string
  resolution?: string
  replies?: TicketReply[]
  createdAt: string
  updatedAt: string
}

export interface TicketReply {
  id: string
  ticketId: string
  senderId: string
  senderRole: 'USER' | 'ADMIN'
  message: string
  createdAt: string
}

// ── API RESPONSE ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ── ANALYTICS ─────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number
  revenueGrowth: number
  totalBookings: number
  bookingsGrowth: number
  activeRentals: number
  totalVehicles: number
  availableVehicles: number
  newUsers: number
  usersGrowth: number
  avgRating: number
}

export interface RevenueData {
  date: string
  revenue: number
  bookings: number
}

export interface FleetUtilization {
  vehicleId: string
  title: string
  utilizationRate: number
  totalBookings: number
  totalRevenue: number
}
