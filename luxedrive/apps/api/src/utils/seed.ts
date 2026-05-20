// ─────────────────────────────────────────────
// LuxeDrive — Database Seed Script
// Run: npm run seed
// ─────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding LuxeDrive database...')

  // ── Admin user ──────────────────────────────
  const adminHash = await bcrypt.hash('Admin@LuxeDrive2024', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@luxedrive.ng' },
    update: {},
    create: {
      email:         'admin@luxedrive.ng',
      passwordHash:  adminHash,
      firstName:     'Admin',
      lastName:      'LuxeDrive',
      role:          'SUPER_ADMIN',
      status:        'ACTIVE',
      emailVerified: true,
    },
  })
  console.log('✓ Admin user:', admin.email)

  // ── Test customer ────────────────────────────
  const customerHash = await bcrypt.hash('Test@1234', 12)
  await prisma.user.upsert({
    where:  { email: 'test@example.com' },
    update: {},
    create: {
      email:         'test@example.com',
      passwordHash:  customerHash,
      firstName:     'Chisom',
      lastName:      'Okafor',
      role:          'CUSTOMER',
      status:        'ACTIVE',
      emailVerified: true,
      referralCode:  'LXD-TEST001',
    },
  })
  console.log('✓ Test customer: test@example.com / Test@1234')

  // ── Vehicles ─────────────────────────────────
  const vehicles = [
    {
      title:            'Mercedes-Benz S-Class 2024',
      brand:            'Mercedes-Benz',
      model:            'S-Class S580',
      year:             2024,
      slug:             'mercedes-benz-s-class-2024',
      description:      'The pinnacle of automotive luxury. Experience world-class comfort with massage seats, Burmester® surround sound, and an AI-powered assistant.',
      transmission:     'AUTOMATIC' as const,
      fuelType:         'PETROL' as const,
      seatingCapacity:  5,
      dailyPrice:       85000,
      weeklyPrice:      510000,
      monthlyPrice:     1700000,
      hasGPS:           true,
      hasInsurance:     true,
      insuranceDetails: 'Comprehensive cover included',
      color:            'Obsidian Black',
      features:         ['Massage Seats', 'Panoramic Roof', 'Night Vision', 'Burmester Sound', 'Ambient Lighting', 'MBUX AI'],
      pickupLocations:  ['Victoria Island, Lagos', 'Ikeja, Lagos', 'Abuja CBD'],
      isFeatured:       true,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200', publicId: 'sclass_1', isPrimary: true, order: 0 },
          { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200', publicId: 'sclass_2', isPrimary: false, order: 1 },
        ],
      },
    },
    {
      title:            'BMW 7 Series 2024',
      brand:            'BMW',
      model:            '7 Series 750i',
      year:             2024,
      slug:             'bmw-7-series-2024',
      description:      'The BMW 7 Series redefines executive travel with Theatre Screen, Executive Lounge, and xDrive all-wheel drive performance.',
      transmission:     'AUTOMATIC' as const,
      fuelType:         'PETROL' as const,
      seatingCapacity:  5,
      dailyPrice:       75000,
      weeklyPrice:      450000,
      monthlyPrice:     1500000,
      hasGPS:           true,
      hasInsurance:     true,
      color:            'Alpine White',
      features:         ['Theatre Screen', 'Executive Lounge', 'Harman Kardon', 'Panoramic Roof', 'xDrive AWD'],
      pickupLocations:  ['Victoria Island, Lagos', 'Lekki Phase 1', 'Abuja CBD'],
      isFeatured:       true,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200', publicId: 'bmw7_1', isPrimary: true, order: 0 },
        ],
      },
    },
    {
      title:            'Rolls-Royce Ghost 2023',
      brand:            'Rolls-Royce',
      model:            'Ghost Extended',
      year:             2023,
      slug:             'rolls-royce-ghost-2023',
      description:      'The Rolls-Royce Ghost. For those who demand nothing but perfection. Starlight headliner, bespoke interior, effortless performance.',
      transmission:     'AUTOMATIC' as const,
      fuelType:         'PETROL' as const,
      seatingCapacity:  5,
      dailyPrice:       250000,
      weeklyPrice:      1500000,
      hasGPS:           true,
      hasInsurance:     true,
      color:            'Forevergreen',
      features:         ['Starlight Headliner', 'Bespoke Interior', 'Magic Carpet Ride', 'Rear Theatre', 'Champagne Cooler'],
      pickupLocations:  ['Victoria Island, Lagos'],
      isFeatured:       true,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1200', publicId: 'rr_ghost_1', isPrimary: true, order: 0 },
        ],
      },
    },
    {
      title:            'Range Rover Autobiography 2024',
      brand:            'Land Rover',
      model:            'Range Rover Autobiography LWB',
      year:             2024,
      slug:             'range-rover-autobiography-2024',
      description:      'Command every terrain in absolute luxury. The Range Rover Autobiography combines supreme off-road capability with first-class comfort.',
      transmission:     'AUTOMATIC' as const,
      fuelType:         'PETROL' as const,
      seatingCapacity:  5,
      dailyPrice:       95000,
      weeklyPrice:      570000,
      monthlyPrice:     1900000,
      hasGPS:           true,
      hasInsurance:     true,
      color:            'Santorini Black',
      features:         ['Rear Executive Class Seats', 'Meridian Sound', 'Air Suspension', 'Head-Up Display', 'Terrain Response'],
      pickupLocations:  ['Victoria Island, Lagos', 'Abuja CBD', 'Port Harcourt'],
      isFeatured:       true,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200', publicId: 'rr_auto_1', isPrimary: true, order: 0 },
        ],
      },
    },
    {
      title:            'Porsche Cayenne Turbo GT 2024',
      brand:            'Porsche',
      model:            'Cayenne Turbo GT',
      year:             2024,
      slug:             'porsche-cayenne-turbo-gt-2024',
      description:      'The fastest SUV Porsche has ever built. 640 hp, Nürburgring record holder, pure sports car performance in an SUV body.',
      transmission:     'AUTOMATIC' as const,
      fuelType:         'PETROL' as const,
      seatingCapacity:  5,
      dailyPrice:       120000,
      weeklyPrice:      720000,
      hasGPS:           true,
      hasInsurance:     true,
      color:            'Carrara White Metallic',
      features:         ['640 HP Twin-Turbo V8', 'Sport Chrono', 'PDCC', 'Alcantara Interior', 'Carbon Fiber Trim'],
      pickupLocations:  ['Victoria Island, Lagos', 'Lekki Phase 1'],
      isFeatured:       false,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200', publicId: 'cayenne_1', isPrimary: true, order: 0 },
        ],
      },
    },
  ]

  for (const vehicleData of vehicles) {
    const { images, ...data } = vehicleData
    await prisma.vehicle.upsert({
      where:  { slug: data.slug },
      update: {},
      create: { ...data, images },
    })
    console.log('✓ Vehicle:', data.title)
  }

  // ── Coupons ──────────────────────────────────
  await prisma.coupon.upsert({
    where:  { code: 'WELCOME20' },
    update: {},
    create: {
      code:          'WELCOME20',
      description:   '20% off your first booking',
      discountType:  'PERCENTAGE',
      discountValue: 20,
      maxDiscount:   50000,
      usageLimit:    1,
      isActive:      true,
    },
  })

  await prisma.coupon.upsert({
    where:  { code: 'LUXE50K' },
    update: {},
    create: {
      code:            'LUXE50K',
      description:     '₦50,000 off bookings above ₦200,000',
      discountType:    'FIXED',
      discountValue:   50000,
      minBookingValue: 200000,
      usageLimit:      100,
      isActive:        true,
    },
  })
  console.log('✓ Coupons seeded')

  // ── Site Settings ─────────────────────────────
  const settings = [
    { key: 'site_name',          value: 'LuxeDrive',                    group: 'general' },
    { key: 'site_tagline',       value: 'Drive in Absolute Luxury',     group: 'general' },
    { key: 'contact_email',      value: 'hello@luxedrive.ng',           group: 'contact' },
    { key: 'contact_phone',      value: '+234 800 000 0000',            group: 'contact' },
    { key: 'contact_address',    value: '14 Adeola Odeku St, Victoria Island, Lagos', group: 'contact' },
    { key: 'booking_tax_rate',   value: '7.5',   type: 'number',        group: 'billing' },
    { key: 'service_fee_rate',   value: '5',     type: 'number',        group: 'billing' },
    { key: 'min_rental_days',    value: '1',     type: 'number',        group: 'booking' },
    { key: 'maintenance_mode',   value: 'false', type: 'boolean',       group: 'general' },
  ]

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where:  { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('✓ Site settings seeded')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:    admin@luxedrive.ng / Admin@LuxeDrive2024')
  console.log('   Customer: test@example.com  / Test@1234')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
