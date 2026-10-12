import { redirect } from 'next/navigation'

// Главная /admin → редирект на /admin/bookings
export default function AdminIndexPage() {
  redirect('/admin/bookings')
}
