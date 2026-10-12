'use client'
import { useEffect, useState, useCallback } from 'react'

type Analytics = {
  period: number
  summary: {
    revenue: number; totalBookings: number; completedCount: number
    cancelledCount: number; noShowCount: number; totalClients: number
    returningClients: number; returnRate: number; avgCheck: number
  }
  popularServices: { name: string; count: number; revenue: number }[]
  barberStats: { name: string; count: number; revenue: number; duration: number }[]
  heatmap: number[][]
  dailyStats: { date: string; count: number; revenue: number }[]
}

const PERIODS = [{ label: '7 дней', value: '7' }, { label: '30 дней', value: '30' }, { label: '90 дней', value: '90' }, { label: '365 дней', value: '365' }]
const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const card = (children: React.ReactNode, style?: React.CSSProperties) => (
  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, ...style }}>
    {children}
  </div>
)

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return card(
    <>
      <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#c8a96e', fontSize: 32, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </>
  )
}

function Heatmap({ data }: { data: number[][] }) {
  const max = Math.max(...data.flat(), 1)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div>
      <h3 style={{ color: '#999', fontSize: 14, marginBottom: 16, fontWeight: 500 }}>Heatmap: день × час</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ color: '#555', padding: '2px 6px', textAlign: 'left', width: 30 }}></th>
              {hours.map(h => <th key={h} style={{ color: '#555', padding: '2px 4px', textAlign: 'center', width: 22 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={di}>
                <td style={{ color: '#666', padding: '2px 6px', fontSize: 11 }}>{day}</td>
                {hours.map(h => {
                  const val = data[di][h]
                  const intensity = val / max
                  const bg = val === 0
                    ? '#111'
                    : `rgba(200,169,110,${0.15 + intensity * 0.85})`
                  return (
                    <td key={h} title={`${day} ${h}:00 — ${val} записей`}
                      style={{ background: bg, width: 20, height: 20, borderRadius: 3, margin: 1, display: 'table-cell', textAlign: 'center', color: intensity > 0.6 ? '#000' : 'transparent' }}>
                      {val > 0 ? val : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ color: '#555', padding: 40, textAlign: 'center' }}>Загрузка аналитики...</div>
  if (!data) return null

  const { summary, popularServices, barberStats, heatmap, dailyStats } = data
  const maxDaily = Math.max(...dailyStats.map(d => d.revenue), 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>📈 Аналитика</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              style={{
                background: period === p.value ? '#c8a96e' : '#1a1a1a',
                color: period === p.value ? '#000' : '#888',
                border: '1px solid #333', borderRadius: 6, padding: '6px 14px',
                fontSize: 13, cursor: 'pointer', fontWeight: period === p.value ? 700 : 400,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Выручка" value={`${summary.revenue.toLocaleString('ru')} ₸`} sub={`${data.period} дней`} />
        <StatCard label="Средний чек" value={`${summary.avgCheck.toLocaleString('ru')} ₸`} />
        <StatCard label="Всего записей" value={summary.totalBookings} />
        <StatCard label="Завершено" value={summary.completedCount} />
        <StatCard label="Отмены" value={summary.cancelledCount} />
        <StatCard label="Неявки" value={summary.noShowCount} />
        <StatCard label="Клиентов" value={summary.totalClients} />
        <StatCard label="Возвращаемость" value={`${summary.returnRate}%`} sub={`${summary.returningClients} из ${summary.totalClients}`} />
      </div>

      {/* Динамика выручки */}
      {card(
        <>
          <h3 style={{ color: '#999', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Выручка по дням</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
            {dailyStats.slice(-60).map((d, i) => (
              <div key={i} title={`${d.date}: ${d.revenue.toLocaleString('ru')} ₸`}
                style={{ flex: 1, background: '#c8a96e', borderRadius: '3px 3px 0 0', minWidth: 4, transition: 'height 0.3s',
                  height: `${Math.max((d.revenue / maxDaily) * 100, d.count > 0 ? 5 : 0)}%` }} />
            ))}
          </div>
          {dailyStats.length === 0 && <p style={{ color: '#444', textAlign: 'center' }}>Нет данных</p>}
        </>,
        { marginBottom: 16 }
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Популярные услуги */}
        {card(
          <>
            <h3 style={{ color: '#999', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Популярные услуги</h3>
            {popularServices.length === 0 && <p style={{ color: '#444' }}>Нет данных</p>}
            {popularServices.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #222' }}>
                <div>
                  <div style={{ color: '#ddd', fontSize: 14 }}>{s.name}</div>
                  <div style={{ color: '#555', fontSize: 12 }}>{s.count} записей</div>
                </div>
                <div style={{ color: '#c8a96e', fontSize: 14, fontWeight: 600 }}>{s.revenue.toLocaleString('ru')} ₸</div>
              </div>
            ))}
          </>
        )}

        {/* Барберы */}
        {card(
          <>
            <h3 style={{ color: '#999', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Загрузка барберов</h3>
            {barberStats.length === 0 && <p style={{ color: '#444' }}>Нет данных</p>}
            {barberStats.map((b, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ color: '#ddd', fontSize: 14 }}>{b.name}</div>
                  <div style={{ color: '#c8a96e', fontWeight: 600 }}>{b.revenue.toLocaleString('ru')} ₸</div>
                </div>
                <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{b.count} записей · {Math.round(b.duration / 60)} ч</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Heatmap */}
      {card(<Heatmap data={heatmap} />)}
    </div>
  )
}
