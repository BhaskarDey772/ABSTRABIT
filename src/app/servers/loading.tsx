import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spinner'

export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-10 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading…
      </div>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </main>
  )
}
