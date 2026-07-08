import Link from 'next/link'
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
      <Link href="/servers" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← All servers
      </Link>
      <div className="mb-8">
        <ServerTabs id={id} />
      </div>
      {children}
    </main>
  )
}
