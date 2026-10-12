import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30' // дней
  const days = Math.min(Math.max(Number(period), 1), 365)

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Все записи за период (кроме отменённых — для части метрик)
  const allBookings = await prisma.bookings.findMany({
    where: { created_at: { gte: since } },
    include: { services: true, client: true },
  })

  const confirmed = allBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
  const completed = allBookings.filter((b: any) => b.status === 'completed')
  const cancelled = allBookings.filter((b: any) => b.status === 'cancelled')
  const noShow = allBookings.filter((b: any) => b.status === 'no_show')

  // ── Выручка ────────────────────────────────────────────────────────────────
  const revenue = completed.reduce((sum: number, b: any) => sum + Number(b.total_price), 0)

  // ── Количество записей ─────────────────────────────────────────────────────
  const totalBookings = allBookings.length
  const completedCount = completed.length
  const cancelledCount = cancelled.length
  const noShowCount = noShow.length

  // ── Популярные услуги ──────────────────────────────────────────────────────
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const b of completed) {
    for (const s of b.services) {
      if (!serviceMap[s.name]) serviceMap[s.name] = { name: s.name, count: 0, revenue: 0 }
      serviceMap[s.name].count++
      serviceMap[s.name].revenue += Number(s.price)
    }
  }
  const popularServices = Object.values(serviceMap).sort((a, b) => b.count - a.count).slice(0, 10)

  // ── Загрузка барберов ──────────────────────────────────────────────────────
  const barberMap: Record<string, { name: string; count: number; revenue: number; duration: number }> = {}
  const barbers = await prisma.barbers.findMany({ where: { is_active: true } })
  for (const barber of barbers) barberMap[barber.id] = { name: barber.name, count: 0, revenue: 0, duration: 0 }
  for (const b of completed) {
    if (barberMap[b.barber_id]) {
      barberMap[b.barber_id].count++
      barberMap[b.barber_id].revenue += Number(b.total_price)
      barberMap[b.barber_id].duration += b.total_duration_min
    }
  }
  const barberStats = Object.values(barberMap).sort((a, b) => b.count - a.count)

  // ── Возвращаемость ─────────────────────────────────────────────────────────
  const clientCounts: Record<string, number> = {}
  for (const b of confirmed) {
    clientCounts[b.client_id] = (clientCounts[b.client_id] ?? 0) + 1
  }
  const returningClients = Object.values(clientCounts).filter(c => c > 1).length
  const totalClients = Object.keys(clientCounts).length
  const returnRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0

  // ── Heatmap день недели × час ──────────────────────────────────────────────
  // grid[weekday][hour] = count  (weekday: 0=Sun…6=Sat, hour: 0-23)
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const b of confirmed) {
    const d = new Date(b.starts_at)
    heatmap[d.getUTCDay()][d.getUTCHours()]++
  }

  // ── Динамика записей по дням ───────────────────────────────────────────────
  const dailyMap: Record<string, { date: string; count: number; revenue: number }> = {}
  for (const b of allBookings) {
    const date = new Date(b.created_at).toISOString().slice(0, 10)
    if (!dailyMap[date]) dailyMap[date] = { date, count: 0, revenue: 0 }
    dailyMap[date].count++
    if (b.status === 'completed') dailyMap[date].revenue += Number(b.total_price)
  }
  const dailyStats = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    period: days,
    since: since.toISOString(),
    summary: {
      revenue: Math.round(revenue),
      totalBookings,
      completedCount,
      cancelledCount,
      noShowCount,
      totalClients,
      returningClients,
      returnRate,
      avgCheck: completedCount > 0 ? Math.round(revenue / completedCount) : 0,
    },
    popularServices,
    barberStats,
    heatmap,
    dailyStats,
  })
}
