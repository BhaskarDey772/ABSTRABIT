import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { retryMirror, retryAiTag, retryStuckReport } from '@/lib/discord/retry'

const STUCK_THRESHOLD_MS = 5 * 60 * 1000

/**
 * Daily safety-net sweep (Vercel Hobby cron is capped at once/day) for anything
 * that failed and wasn't manually retried from the dashboard. Manual retry is
 * still the fast path — this just guarantees nothing sits broken forever.
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const [failedMirrors, failedAi, stuckReports] = await Promise.all([
    prisma.interaction.findMany({
      where: { mirrorStatus: 'FAILED', retryCount: { lt: 5 } },
      include: { server: true },
      take: 100,
    }),
    prisma.interaction.findMany({
      where: { aiFailed: true, retryCount: { lt: 5 } },
      include: { server: true },
      take: 100,
    }),
    prisma.interaction.findMany({
      where: {
        status: 'PROCESSING',
        createdAt: { lt: new Date(Date.now() - STUCK_THRESHOLD_MS) },
        retryCount: { lt: 5 },
      },
      include: { server: true },
      take: 100,
    }),
  ])

  const mirrorResults = await Promise.all(failedMirrors.map((i) => retryMirror(i)))
  const aiResults = await Promise.all(failedAi.map((i) => retryAiTag(i)))
  const stuckResults = await Promise.all(stuckReports.map((i) => retryStuckReport(i)))

  return NextResponse.json({
    mirrorRetried: failedMirrors.length,
    mirrorFixed: mirrorResults.filter((r) => r.ok).length,
    aiRetried: failedAi.length,
    aiFixed: aiResults.filter((r) => r.ok).length,
    stuckRetried: stuckReports.length,
    stuckFixed: stuckResults.filter((r) => r.ok).length,
  })
}
