import { getAdminSession } from '@/lib/session'
import AdminNav from '@/components/admin/AdminNav'

export const metadata = { title: 'Barbershop Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth guard is in middleware.ts — no redirect here to avoid loops.
  // If no session (= login page), render without the sidebar nav.
  const session = await getAdminSession()

  if (!session.adminId) {
    // Login page — render without admin shell
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', fontFamily: 'system-ui, sans-serif', color: '#e0e0e0' }}>
      <AdminNav login={session.login ?? ''} />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
