'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  async function signIn() {
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Discord Bot Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn} className="w-full">
            Sign in with Discord
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
