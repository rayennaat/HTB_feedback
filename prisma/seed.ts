import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.MODERATOR_BOT_EMAIL || 'admin@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || randomBytes(32).toString('hex')
const DEFAULT_PASSWORD = 'P1$$w0rD123!'
const FLAG = process.env.FLAG || 'FLAG{local_test_flag_not_real}'

async function main() {
  // Clean slate 
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Notification", "Report", "Comment", "Feedback", "User" RESTART IDENTITY CASCADE')

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const userPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // Users
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: ADMIN_EMAIL,
      password: adminPasswordHash,
      isAdmin: true
    }
  })

  const jamie = await prisma.user.create({
    data: { username: 'jamie', email: 'jamie@example.com', password: userPasswordHash }
  })

  const kenji = await prisma.user.create({
    data: { username: 'kenji', email: 'kenji@example.com', password: userPasswordHash }
  })

  const lara = await prisma.user.create({
    data: { username: 'lara', email: 'lara@example.com', password: userPasswordHash }
  })

  const nour = await prisma.user.create({
    data: { username: 'nour', email: 'nour@example.com', password: userPasswordHash }
  })

  // Seeded posts: public IDs 1-5, hidden flag ID 6, public IDs 7-8 
  await prisma.feedback.create({
    data: {
      title: 'Laptop repair shop kept delaying pickup',
      message:
        'Dropped off a laptop for a simple battery replacement. The shop promised two days, then kept delaying for almost three weeks without clear updates. I finally got it back, but the communication was terrible.',
      category: 'Customer Support',
      subject: 'FixPoint Repairs',
      city: 'London',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: jamie.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Refund took a month after cancelled order',
      message:
        'Cancelled an online furniture order before it shipped. Support confirmed the cancellation, but the refund only arrived after five calls and a payment dispute. Keep screenshots of every support reply.',
      category: 'Online Shopping',
      subject: 'HomeCart',
      city: 'New York',
      experienceType: 'Warning',
      status: 'approved',
      userId: kenji.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Internet provider fixed outage quickly',
      message:
        'Reported a neighborhood outage in the morning and got a technician update within an hour. Service was back before the workday ended. Surprisingly smooth support experience.',
      category: 'Telecom & Internet',
      subject: 'MetroNet Mobile',
      city: 'Berlin',
      experienceType: 'Recommendation',
      status: 'approved',
      userId: lara.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Subscription charged after cancellation',
      message:
        'Cancelled my fitness app subscription from the account page, but I was billed again the next cycle. Support eventually refunded me, but only after I sent proof of the cancellation email.',
      category: 'Banks & Payments',
      subject: 'FitTrack Plus',
      city: 'Remote',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: nour.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Is TravelNest reliable for last minute hotel bookings?',
      message:
        'I am looking at a same-day booking through TravelNest and the price is much lower than the hotel site. Has anyone had trouble with reservations not showing up at check-in?',
      category: 'Travel & Hotels',
      subject: 'TravelNest',
      city: 'Paris',
      experienceType: 'Question',
      status: 'approved',
      userId: jamie.id
    }
  })

  // Hidden rejected post with the flag. With identity reset, this is feedback ID 6.
  const flagPost = await prisma.feedback.create({
    data: {
      title: 'Refund request rejected after delivery issue',
      message:
        'Filed a refund request after a delivery issue. Case was reviewed and closed by the moderation team.',
      category: 'Online Shopping',
      subject: 'Unnamed Vendor',
      city: 'Remote',
      experienceType: 'Bad Experience',
      status: 'rejected',
      moderationReason: 'Hidden because the attached proof contains private customer details',
      adminNote: FLAG,
      userId: nour.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Delivery driver marked package as delivered too early',
      message:
        'Tracking showed delivered two hours before the package actually arrived. Support was polite but could not explain the mismatch. It worked out, but the tracking caused a lot of stress.',
      category: 'Delivery & Couriers',
      subject: 'QuickShip',
      city: 'Toronto',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: lara.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Coworking space handled a noisy room complaint well',
      message:
        'Booked a desk near a private event and could barely take calls. The front desk moved me to a quieter floor and added a free day credit without arguing. Good recovery from a bad start.',
      category: 'Jobs & Workplaces',
      subject: 'DeskBridge Coworking',
      city: 'Amsterdam',
      experienceType: 'Good Experience',
      status: 'approved',
      userId: kenji.id
    }
  })

  console.log('Seed complete.')
  console.log(`Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD env value' : 'random generated password'}`)
  console.log(`Sample users: jamie, kenji, lara, nour / ${DEFAULT_PASSWORD}`)
  console.log(`Hidden post id: ${flagPost.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })