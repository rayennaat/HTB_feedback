import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JwtPayload {
  id: number
  username: string
}

const responseCache = (globalThis as typeof globalThis & {
  __feedbackApiCache?: Map<string, { body: unknown; cachedAt: number }>
}).__feedbackApiCache ?? (() => {
  const m = new Map<string, { body: unknown; cachedAt: number }>()
  ;(globalThis as typeof globalThis & { __feedbackApiCache?: typeof m }).__feedbackApiCache = m
  return m
})()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const getCacheKey = (req: NextRequest) => new URL(req.url).pathname

const getFeedbackId = (req: NextRequest) => {
  const url = new URL(req.url)
  const idParam = url.pathname.split('/').at(-1)
  return parseInt(idParam || '')
}

const getCurrentUserId = (req: NextRequest) => {
  const token = req.cookies.get('authToken')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded.id
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const feedbackId = getFeedbackId(req)

  if (isNaN(feedbackId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  const cacheKey = getCacheKey(req)
  const cached = responseCache.get(cacheKey)

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.body, {
      headers: { 'X-Feedback-Cache': 'HIT' }
    })
  }

  const currentUserId = getCurrentUserId(req)

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      user: { select: { id: true, username: true, email: true, isAdmin: true } },
      likedBy: { select: { id: true } },
      savedBy: { select: { id: true } },
      _count: { select: { comments: true } }
    }
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  let currentUserIsAdmin = false
  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true }
    })
    currentUserIsAdmin = Boolean(currentUser?.isAdmin)
  }

  const canView =
    feedback.status === 'approved' ||
    feedback.userId === currentUserId ||
    currentUserIsAdmin

  if (!canView) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const responseBody: Record<string, unknown> = {
    id: feedback.id,
    title: feedback.title,
    message: feedback.message,
    category: feedback.category,
    subject: feedback.subject,
    city: feedback.city,
    experienceType: feedback.experienceType,
    isAnonymous: feedback.isAnonymous,
    proofImageUrl: feedback.proofImageUrl,
    likes: feedback.likes,
    commentsCount: feedback._count.comments,
    date: feedback.date.toISOString(),
    user: feedback.isAnonymous ? 'Anonymous' : feedback.user.username,
    userId: feedback.user.id,
    status: feedback.status,
    isCurrentUser: currentUserId === feedback.user.id,
    likedByCurrentUser: currentUserId
      ? feedback.likedBy.some(u => u.id === currentUserId)
      : false,
    savedByCurrentUser: currentUserId
      ? feedback.savedBy.some(u => u.id === currentUserId)
      : false,
    moderationReason: feedback.moderationReason
  }

  if (currentUserIsAdmin) {
    responseBody.adminNote = feedback.adminNote
    responseBody.authorEmail = feedback.user.email
  }

  responseCache.set(cacheKey, { body: responseBody, cachedAt: Date.now() })

  return NextResponse.json(responseBody, {
    headers: { 'X-Feedback-Cache': 'MISS' }
  })
}