'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { DiscordIcon } from '@/components/discord-icon'
import { Spinner } from '@/components/spinner'

export default function LoginPage() {
  const [pending, setPending] = useState(false)

  async function signIn() {
    setPending(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify guilds',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0b14] bg-cover bg-center p-4"
      style={{ backgroundImage: 'url(/discord-bg.svg)' }}
    >
      <Card className="relative w-full max-w-sm border-white/10 bg-card/90 backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <DiscordIcon className="size-7" />
          </div>
          <CardTitle className="text-xl">Discord Bot Admin</CardTitle>
          <CardDescription>Sign in to manage connected servers and commands.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn} disabled={pending} className="w-full gap-2">
            {pending ? <Spinner /> : <DiscordIcon className="size-4" />}
            {pending ? 'Redirecting…' : 'Sign in with Discord'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
