'use client'

import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

/** Must be rendered as a child of <Link>. Swaps its children for a spinner while
 *  that link's navigation is in flight - shows immediately on click instead of
 *  waiting for the destination's loading.tsx to paint, which can resolve too
 *  fast to ever visibly show. */
export function LinkStatusIcon({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus()
  if (pending) return <Loader2 className="size-4 animate-spin" />
  return <>{children}</>
}
