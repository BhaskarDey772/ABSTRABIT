import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const discordIdentity = data.user.identities?.find((i) => i.provider === 'discord')
  const identityData = discordIdentity?.identity_data ?? {}
  const discordUserId = String(identityData.provider_id ?? identityData.sub ?? '')
  const discordUsername = String(identityData.full_name ?? identityData.name ?? identityData.user_name ?? 'unknown')

  if (!discordUserId) {
    return NextResponse.redirect(`${origin}/login?error=no_discord_identity`)
  }

  await prisma.adminUser.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      discordUserId,
      discordUsername,
      discordAccessToken: data.session.provider_token ?? null,
    },
    update: {
      discordUsername,
      discordAccessToken: data.session.provider_token ?? undefined,
    },
  })

  return NextResponse.redirect(`${origin}/servers`)
}
