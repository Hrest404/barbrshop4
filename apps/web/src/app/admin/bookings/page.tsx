'use client'
import { useEffect, useState, useCallback } from 'react'

type Booking = {
  id: string; starts_at: string; status: string; total_price: number; total_duration_min: number
  manage_token: string
  client: { name: string; phone: string }
  barber: { name: string }
  services: { name: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#4ade80', completed: '#60a5fa', cancelled: '#f87171', no_show: '#facc15',
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Подтверждена', completed: 'Завершена', cancelled: 'Отменена', no_show: 'Неявка',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams()
    if (status) q.set('status', status)
    if (date) q.set('date', date)
    const res = await fetch(`/api/admin/bookings?${q}`)
    setBookings(await res.json())
    setLoading(false)
  }, [status, date])

  useEffect(() => { load() }, [load])

  async function action(id: string, payload: object) {
    await fetch(`/api/admin/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSelected(null)
    load()
  }

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>📅 Записи</h1>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#ccc', padding: '8px 12px', fontSize: 14 }}>
          <option value="">Все статусы</option>
          <option value="confirmed">Подтверждена</option>
          <option value="completed">Завершена</option>
          <option value="cancelled">Отменена</option>
          <option value="no_show">Неявка</option>
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#ccc', padding: '8px 12px', fontSize: 14 }} />
        <button onClick={() => { setStatus(''); setDate('') }}
          style={{ background: '#2a2a2a', border: 'none', borderRadius: 8, color: '#888', padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}>
          Сбросить
        </button>
      </div>

      {loading ? <p style={{ color: '#555' }}>Загрузка...</p> : (
        <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#111' }}>
                {['Дата/время', 'Клиент', 'Барбер', 'Услуги', 'Сумма', 'Статус', ''].map(h => (
                  <th key={h} style={{ color: '#555', fontWeight: 500, padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #222' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const dt = new Date(b.starts_at)
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <td style={{ padding: '12px 16px', color: '#ddd' }}>
                      {dt.toLocaleDateString('ru-RU', { timeZone: 'UTC' })}<br />
                      <span style={{ color: '#666', fontSize: 12 }}>{dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#ddd' }}>{b.client.name}<br /><span style={{ color: '#555', fontSize: 12 }}>{b.client.phone}</span></td>
                    <td style={{ padding: '12px 16px', color: '#ddd' }}>{b.barber.name}</td>
                    <td style={{ padding: '12px 16px', color: '#999', fontSize: 12 }}>{b.services.map(s => s.name).join(', ')}</td>
                    <td style={{ padding: '12px 16px', color: '#c8a96e', fontWeight: 600 }}>{Number(b.total_price).toLocaleString('ru')} ₸</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${STATUS_COLORS[b.status]}22`, color: STATUS_COLORS[b.status], borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {b.status === 'confirmed' && (
                        <button onClick={() => setSelected(b)}
                          style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 6, color: '#aaa', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                          Действия
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {bookings.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#444' }}>Записей нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка действий */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 32, width: 360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: 20 }}>Действия с записью</h3>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>{selected.client.name} · {selected.barber.name}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <button onClick={() => action(selected.id, { action: 'cancel' })}
                style={{ background: '#ff555522', border: '1px solid #ff5555', borderRadius: 8, color: '#ff5555', padding: '10px', cursor: 'pointer' }}>
                Отменить запись
              </button>
              <button onClick={() => action(selected.id, { action: 'status', status: 'completed' })}
                style={{ background: '#60a5fa22', border: '1px solid #60a5fa', borderRadius: 8, color: '#60a5fa', padding: '10px', cursor: 'pointer' }}>
                Завершить
              </button>
              <button onClick={() => action(selected.id, { action: 'status', status: 'no_show' })}
                style={{ background: '#facc1522', border: '1px solid #facc15', borderRadius: 8, color: '#facc15', padding: '10px', cursor: 'pointer' }}>
                Отметить неявку
              </button>
            </div>

            <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
              <p style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>Перенести на:</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
                  style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, color: '#ccc', padding: '8px' }} />
                <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)}
                  style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6, color: '#ccc', padding: '8px' }} />
              </div>
              <button onClick={() => rescheduleDate && rescheduleTime && action(selected.id, { action: 'reschedule', date: rescheduleDate, time: rescheduleTime })}
                style={{ width: '100%', background: '#c8a96e', color: '#000', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Перенести
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
