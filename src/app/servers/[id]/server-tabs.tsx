'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function ServerTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const tabs = [
    { href: `/servers/${id}/log`, label: 'Log' },
    { href: `/servers/${id}/config`, label: 'Config' },
  ]

  return (
    <nav className="flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
