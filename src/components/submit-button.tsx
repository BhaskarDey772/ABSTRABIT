'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

/** Button for use inside a <form action={serverAction}>. Shows a pending state
 *  automatically via useFormStatus - plain shadcn Button gives no feedback at all
 *  while a server action is in flight. */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? (pendingText ?? 'Saving…') : children}
    </Button>
  )
}
