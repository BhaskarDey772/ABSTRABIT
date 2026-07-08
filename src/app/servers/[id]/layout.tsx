import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-3xl p-8">
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link href={`/servers/${id}/log`} className="text-foreground hover:text-primary">
          Log
        </Link>
        <Link href={`/servers/${id}/config`} className="text-foreground hover:text-primary">
          Config
        </Link>
        <Link href="/servers" className="ml-auto text-muted-foreground hover:text-foreground">
          ← All servers
        </Link>
      </nav>
      <Separator className="mb-6" />
      {children}
    </main>
  )
}
