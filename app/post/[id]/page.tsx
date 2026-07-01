import type { Metadata } from 'next'
import { headers, cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PostDetailClient from './PostDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

const getPost = async (id: number) => {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('authToken')?.value
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

  const res = await fetch(`${protocol}://${host}/api/feedback/${id}`, {
    headers: {
      ...(authToken ? { Cookie: `authToken=${authToken}` } : {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const postId = Number(id)

  if (!Number.isInteger(postId)) {
    return { title: 'Post not found | Feedback TN' }
  }

  const post = await getPost(postId)

  if (!post) {
    return { title: 'Post not found | Feedback TN' }
  }

  const description =
    post.message.length > 155 ? `${post.message.slice(0, 152)}...` : post.message

  return {
    title: `${post.title} | Feedback TN`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
    },
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const postId = Number(id)

  if (!Number.isInteger(postId)) {
    notFound()
  }

  const post = await getPost(postId)

  if (!post) {
    notFound()
  }

  return (
    <main className="app-shell px-4 py-6 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between border-b border-stone-200/80 pb-4">
          <Link href="/feedback" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
            Back to experiences
          </Link>
          <Link href="/" className="text-sm font-semibold text-stone-700 hover:text-stone-950">
            Feedback TN
          </Link>
        </header>

        <PostDetailClient
          initialPost={{
            id: post.id,
            title: post.title,
            message: post.message,
            category: post.category,
            subject: post.subject,
            city: post.city,
            experienceType: post.experienceType,
            isAnonymous: post.isAnonymous,
            proofImageUrl: post.proofImageUrl,
            likes: post.likes,
            commentsCount: post.commentsCount,
            date: post.date,
            user: post.user,
            status: post.status,
            isLiked: post.likedByCurrentUser ?? false,
            isSaved: post.savedByCurrentUser ?? false,
          }}
        />
      </div>
    </main>
  )
}