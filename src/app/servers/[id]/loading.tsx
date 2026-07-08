import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spinner'

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading…
      </div>
      <Skeleton className="mb-2 h-6 w-64" />
      <Skeleton className="mb-6 h-4 w-96" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}
