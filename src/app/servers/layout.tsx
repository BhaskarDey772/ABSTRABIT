import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { signOutAction } from './actions'
import { Button } from '@/components/ui/button'

export default async function ServersRootLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link href="/servers" className="font-semibold">
            Discord Bot Admin
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{admin.discordUsername}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
