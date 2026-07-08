import Link from 'next/link'

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="mx-auto max-w-3xl p-8 text-neutral-100">
      <nav className="mb-6 flex gap-4 border-b border-neutral-800 pb-3 text-sm">
        <Link href={`/servers/${id}/log`} className="hover:text-indigo-400">
          Log
        </Link>
        <Link href={`/servers/${id}/config`} className="hover:text-indigo-400">
          Config
        </Link>
        <Link href="/servers" className="ml-auto text-neutral-500 hover:text-neutral-300">
          ← All servers
        </Link>
      </nav>
      {children}
    </main>
  )
}
