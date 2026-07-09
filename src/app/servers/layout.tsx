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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[72px] shrink-0 border-r border-border bg-card/50 flex flex-col items-center gap-3 py-4">
        <Link
          href="/servers"
          title="Dashboard"
          className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Bot className="size-5" />
        </Link>
        
        <div className="h-px w-8 bg-border" />
        
        {servers.map((s) => (
          <Link
            key={s.id}
            href={`/servers/${s.id}/log`}
            title={s.guildName}
            className="flex size-11 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground shadow-md hover:shadow-lg transition-all hover:bg-accent hover:text-accent-foreground group relative"
          >
            {initials(s.guildName)}
            <div className="absolute left-full ml-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
              {s.guildName}
            </div>
          </Link>
        ))}
        
        <div className="mt-auto">
          <Link
            href="/servers/connect"
            title="Connect a server"
            className="flex size-11 items-center justify-center rounded-xl bg-secondary/50 text-accent shadow-md hover:shadow-lg transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-5" />
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Bot Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs text-muted-foreground">{admin.discordUsername}</span>
              </div>
              <form action={signOutAction}>
                <SubmitButton variant="ghost" size="sm" pendingText="Signing out…" className="gap-2">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </SubmitButton>
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
