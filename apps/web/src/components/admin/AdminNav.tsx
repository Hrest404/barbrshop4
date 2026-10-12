'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: '📊 Dashboard', exact: true },
  { href: '/admin/bookings', label: '📅 Записи' },
  { href: '/admin/barbers', label: '✂️ Барберы' },
  { href: '/admin/services', label: '💈 Услуги' },
  { href: '/admin/reviews', label: '⭐ Отзывы' },
  { href: '/admin/settings', label: '⚙️ Настройки' },
  { href: '/admin/analytics', label: '📈 Аналитика' },
]

export default function AdminNav({ login }: { login: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav style={{
      width: 220, background: '#111', borderRight: '1px solid #222',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222' }}>
        <div style={{ fontSize: 22 }}>✂️</div>
        <div style={{ color: '#c8a96e', fontWeight: 700, marginTop: 4 }}>Admin Panel</div>
        <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{login}</div>
      </div>

      <div style={{ flex: 1, padding: '12px 0' }}>
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display: 'block', padding: '10px 20px', color: active ? '#c8a96e' : '#888',
              textDecoration: 'none', fontWeight: active ? 600 : 400,
              background: active ? 'rgba(200,169,110,0.08)' : 'transparent',
              borderLeft: active ? '3px solid #c8a96e' : '3px solid transparent',
              fontSize: 14, transition: 'all 0.15s',
            }}>
              {label}
            </Link>
          )
        })}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #222' }}>
        <button onClick={logout} style={{
          width: '100%', background: 'transparent', border: '1px solid #333',
          borderRadius: 6, color: '#666', padding: '8px', fontSize: 13, cursor: 'pointer',
        }}>
          Выйти
        </button>
      </div>
    </nav>
  )
}
