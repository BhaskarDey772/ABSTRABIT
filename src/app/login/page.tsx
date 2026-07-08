'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Discord Bot Admin</CardTitle>
          <CardDescription>Sign in to manage connected servers and commands.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn} disabled={pending} className="w-full">
            {pending ? 'Redirecting…' : 'Sign in with Discord'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
