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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card to-background p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 size-72 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 size-72 rounded-full bg-accent/5 blur-3xl animate-pulse" />
      </div>

      <Card className="relative w-full max-w-md border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="items-center text-center pb-6">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
            <DiscordIcon className="size-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Discord Bot Admin</CardTitle>
          <CardDescription className="mt-2 text-sm">
            Manage your Discord servers and bot commands with ease.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={signIn} 
            disabled={pending} 
            className="w-full gap-2 h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {pending ? (
              <>
                <Spinner className="size-4" />
                Redirecting…
              </>
            ) : (
              <>
                <DiscordIcon className="size-5" />
                Sign in with Discord
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We use your Discord account to verify server ownership. Your data is secure.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
