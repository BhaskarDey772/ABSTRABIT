import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/** Current AdminUser row for the signed-in session, or redirects to /login. */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await prisma.adminUser.findUnique({ where: { id: user.id } })
  if (!admin) redirect('/login')

  return admin
}
