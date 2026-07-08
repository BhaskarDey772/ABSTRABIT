import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ServerTabs } from './server-tabs'

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-4xl px-10 py-8">
      <Link
        href="/servers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All servers
      </Link>
      <div className="mb-8">
        <ServerTabs id={id} />
      </div>
      {children}
    </main>
  )
}
