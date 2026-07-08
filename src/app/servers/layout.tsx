import Link from 'next/link'
import { Plus, LogOut, Bot } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { signOutAction } from './actions'
import { prisma } from '@/lib/prisma'
import { SubmitButton } from '@/components/submit-button'

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

export default async function ServersRootLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <div className="flex min-h-screen">
      {/* Discord-style icon rail: one circle per connected server, "+" to connect another. */}
      <aside className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-sidebar py-3">
        {servers.map((s) => (
          <Link
            key={s.id}
            href={`/servers/${s.id}/log`}
            title={s.guildName}
            className="flex size-12 items-center justify-center rounded-3xl bg-secondary text-sm font-semibold text-secondary-foreground shadow-sm transition-all hover:rounded-2xl hover:bg-primary hover:text-primary-foreground"
          >
            {initials(s.guildName)}
          </Link>
        ))}
        <div className="my-1 h-px w-8 bg-sidebar-border" />
        <Link
          href="/servers/connect"
          title="Connect a server"
          className="flex size-12 items-center justify-center rounded-3xl bg-secondary text-emerald-400 shadow-sm transition-all hover:rounded-2xl hover:bg-emerald-500 hover:text-white"
        >
          <Plus className="size-5" />
        </Link>
      </aside>

      <div className="flex-1">
        <header className="border-b border-border bg-card/40">
          <div className="flex items-center justify-between px-10 py-4">
            <Link href="/servers" className="flex items-center gap-2 font-semibold">
              <Bot className="size-5 text-primary" />
              Discord Bot Admin
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{admin.discordUsername}</span>
              <form action={signOutAction}>
                <SubmitButton variant="outline" size="sm" pendingText="Signing out…">
                  <LogOut className="size-4" />
                  Sign out
                </SubmitButton>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
