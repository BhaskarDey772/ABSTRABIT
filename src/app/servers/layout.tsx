import Link from 'next/link'
import { Plus, LogOut, Bot } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { signOutAction } from './actions'
import { prisma } from '@/lib/prisma'
import { SubmitButton } from '@/components/submit-button'
import { LinkStatusIcon } from '@/components/link-status-spinner'

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

export default async function ServersRootLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const servers = await prisma.server.findMany({ where: { connectedById: admin.id } })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - fixed to the viewport; only <main> below scrolls. */}
      <aside className="w-[72px] shrink-0 overflow-y-auto border-r border-border bg-card/50 flex flex-col items-center gap-3 py-4">
        <Link
          href="/servers"
          title="Dashboard"
          className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <LinkStatusIcon>
            <Bot className="size-5" />
          </LinkStatusIcon>
        </Link>

        <div className="h-px w-8 bg-border" />

        {servers.map((s) => (
          <Link
            key={s.id}
            href={`/servers/${s.id}/log`}
            title={s.guildName}
            className="group relative flex size-11 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground shadow-md transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-lg"
          >
            <LinkStatusIcon>{initials(s.guildName)}</LinkStatusIcon>
            <div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground group-hover:block">
              {s.guildName}
            </div>
          </Link>
        ))}

        <div className="mt-auto">
          <Link
            href="/servers/connect"
            title="Connect a server"
            className="flex size-11 items-center justify-center rounded-xl bg-secondary/50 text-accent shadow-md transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-lg"
          >
            <LinkStatusIcon>
              <Plus className="size-5" />
            </LinkStatusIcon>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <header className="shrink-0 border-b border-border bg-card/60 backdrop-blur-sm z-40">
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
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
