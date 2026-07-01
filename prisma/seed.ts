import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.MODERATOR_BOT_EMAIL || 'admin@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || randomBytes(32).toString('hex')
const DEFAULT_PASSWORD = 'Password123!'
const FLAG = process.env.FLAG || 'FLAG{local_test_flag_not_real}'

async function main() {
  // --- Clean slate ---
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Notification", "Report", "Comment", "Feedback", "User" RESTART IDENTITY CASCADE')

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const userPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // --- Users ---
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

  // --- Approved public posts ---
  await prisma.feedback.create({
    data: {
      title: 'Received a broken watch after 2 week wait',
      message:
        'Ordered a Casio watch from Jumia, it arrived with a cracked screen and the strap was already detached from the case. Contacted support 3 times, no response. Complete waste of money.',
      category: 'Shopping',
      subject: 'Jumia',
      city: 'Tunis',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: jamie.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Seller disappeared after receiving payment',
      message:
        'Agreed to buy a PlayStation 5 from a seller on Facebook Marketplace. Sent 850 TND via D17, seller blocked me immediately. No product, no refund, no response. Be careful with this platform.',
      category: 'Shopping',
      subject: 'Facebook Marketplace',
      city: 'Sfax',
      experienceType: 'Warning',
      status: 'approved',
      userId: kenji.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Food arrived cold and order was wrong',
      message:
        'Ordered a large pepperoni pizza and garlic bread. What arrived was completely cold, wrong toppings, and one item missing. Delivery took 1h20 for a 20 minute distance. Never again.',
      category: 'Food & Restaurants',
      subject: 'Pizza Hut Lac',
      city: 'Tunis',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: lara.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: '4G speeds completely unusable for 3 weeks',
      message:
        'Been paying for 4G and getting 0.3 Mbps consistently for almost a month. Called customer service twice, they keep saying "technical team is working on it." No compensation offered.',
      category: 'Telecom',
      subject: 'Ooredoo Tunisia',
      city: 'Ariana',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: nour.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Account frozen with no explanation for 10 days',
      message:
        'My account was frozen without any notification or reason given. Went to the branch twice, each time they told me to come back. Salary got deposited and I couldn\'t access it for 10 days.',
      category: 'Banking & Finance',
      subject: 'BNA Bank',
      city: 'Tunis',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: jamie.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Best private clinic experience I have had in Tunisia',
      message:
        'Went in for a minor procedure. Staff was professional, facility was clean, waiting time was under 20 minutes. Doctor explained everything clearly. Highly recommend.',
      category: 'Healthcare',
      subject: 'Clinique Les Oliviers',
      city: 'Sousse',
      experienceType: 'Recommendation',
      status: 'approved',
      userId: kenji.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Charged annual fee then closed without warning',
      message:
        'Paid 600 TND for a full year membership in January. By March the gym closed its doors with no announcement, no refunds, and the owner is unreachable. Avoid annual upfront payment gyms.',
      category: 'Sports & Fitness',
      subject: 'Fit Zone Gym',
      city: 'Tunis',
      experienceType: 'Warning',
      status: 'approved',
      userId: lara.id
    }
  })


  // Hidden rejected post with the flag
  const flagPost = await prisma.feedback.create({
    data: {
      title: 'Refund request rejected after delivery issue',
      message:
        'Filed a refund request after a delivery issue. Case was reviewed and closed by the moderation team.',
      category: 'Shopping',
      subject: 'Unnamed Vendor',
      city: 'Tunis',
      experienceType: 'Bad Experience',
      status: 'rejected',
      moderationReason: 'Hidden because the attached proof contains private customer details',
      adminNote: FLAG,
      userId: nour.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Agent showed us apartments that did not match the listing',
      message:
        'Wasted three weekends visiting apartments listed at one price that were completely different in person — wrong size, different floor, different condition. Felt like bait and switch.',
      category: 'Real Estate',
      subject: 'Century 21 Tunisia',
      city: 'Tunis',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: nour.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Does Carrefour La Marsa accept returns without a receipt?',
      message:
        'Bought a blender two days ago and it stopped working already. I lost the receipt but still have the original box and the item is clearly defective. Anyone been through this?',
      category: 'General Question',
      subject: 'Carrefour Tunisia',
      city: 'Tunis',
      experienceType: 'Question',
      status: 'approved',
      userId: jamie.id
    }
  })

  await prisma.feedback.create({
    data: {
      title: 'Package marked delivered but never arrived',
      message:
        'Tracking showed my package as delivered on Tuesday. Nothing arrived. Neighbor didn\'t receive it either. Opened a claim, they said the driver confirmed delivery but could not provide proof.',
      category: 'Shipping & Delivery',
      subject: 'Aramex Tunisia',
      city: 'Bizerte',
      experienceType: 'Bad Experience',
      status: 'approved',
      userId: lara.id
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