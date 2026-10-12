'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export default function ManageBookingPage() {
  const { token } = useParams()
  const [booking, setBooking] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/bookings/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Запись не найдена')
        return res.json()
      })
      .then(data => {
        setBooking(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  const handleCancel = async () => {
    if (!confirm('Вы уверены, что хотите отменить запись?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${token}/cancel`, {
        method: 'POST'
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Ошибка отмены')
      }
      setBooking({ ...booking, status: 'cancelled' })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center text-dark-muted">Загрузка...</div>
  if (error) return <div className="min-h-screen pt-32 text-center text-red-500">{error}</div>
  if (!booking) return null

  const d = new Date(booking.starts_at)
  const isCancelled = booking.status === 'cancelled'
  const isCompleted = booking.status === 'completed'
  const isPast = d < new Date()

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Управление записью</h1>
        
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-6 border-b border-dark-border pb-6">
            <div>
              <div className="text-sm text-dark-muted mb-1">Статус</div>
              {isCancelled ? (
                <div className="inline-block px-3 py-1 bg-red-500/10 text-red-500 rounded text-sm font-bold">Отменена</div>
              ) : isCompleted ? (
                <div className="inline-block px-3 py-1 bg-green-500/10 text-green-500 rounded text-sm font-bold">Завершена</div>
              ) : (
                <div className="inline-block px-3 py-1 bg-brand/10 text-brand rounded text-sm font-bold">Подтверждена</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-dark-muted mb-1">Дата и время</div>
              <div className="font-bold text-lg">{d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
              <div className="text-xl">{d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-dark-muted mb-1">Услуги</div>
              {booking.services.map((s: any) => (
                <div key={s.service_id} className="flex justify-between font-medium">
                  <span>{s.name}</span>
                  <span>{s.price}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-dark-border">
              <div className="text-sm text-dark-muted mb-1">Мастер</div>
              <div className="font-medium">{booking.barber.name}</div>
            </div>

            <div className="pt-4 border-t border-dark-border">
              <div className="text-sm text-dark-muted mb-1">Итого</div>
              <div className="font-bold text-xl">{booking.total_price}</div>
            </div>
          </div>
        </div>

        {!isCancelled && !isCompleted && !isPast && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 border border-red-500/50 text-red-500 font-bold rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Отменить запись
            </button>
            <Link 
              href="/book" 
              className="flex-1 px-6 py-3 border border-brand/50 text-brand text-center font-bold rounded hover:bg-brand/10 transition-colors"
            >
              Новая запись
            </Link>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-dark-muted hover:text-dark-text transition-colors">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  )
}
