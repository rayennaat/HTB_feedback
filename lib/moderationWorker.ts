import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET!
const MODERATOR_EMAIL = process.env.MODERATOR_BOT_EMAIL || 'admin@gmail.com'
const POLL_INTERVAL_MS = Number(process.env.MODERATOR_POLL_INTERVAL_MS || 15_000)
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000'

const LINK_PATTERN = /\/post\/(\d+)/

let moderatorToken: string | null = null

async function getModeratorToken(): Promise<string | null> {
  if (moderatorToken) return moderatorToken

  const moderator = await prisma.user.findUnique({
    where: { email: MODERATOR_EMAIL }
  })

  if (!moderator || !moderator.isAdmin) return null

  moderatorToken = jwt.sign(
    { id: moderator.id, username: moderator.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  return moderatorToken
}

async function visitLink(path: string, token: string) {
  try {
    await fetch(`${APP_ORIGIN}${path}`, {
      headers: { Cookie: `authToken=${token}` },
      cache: 'no-store'
    })
  } catch {
    // best-effort, queue continues regardless
  }
}

async function processOpenReports() {
  const token = await getModeratorToken()
  if (!token) return

  const openReports = await prisma.report.findMany({
    where: { status: 'open' },
    orderBy: { date: 'asc' },
    take: 10
  })

  for (const report of openReports) {
    const match = report.details.match(LINK_PATTERN)
    if (match) {
      await visitLink(`/post/${match[1]}`, token)
    }

    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'reviewed' }
    })
  }
}

let started = false

export function startModerationWorker() {
  if (started) return
  started = true

  setInterval(() => {
    processOpenReports().catch(() => {})
  }, POLL_INTERVAL_MS)
}
