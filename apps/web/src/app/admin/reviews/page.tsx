'use client'
import { useEffect, useState, useCallback } from 'react'

type Review = {
  id: string; rating: number; comment: string | null; is_public: boolean; created_at: string
  client: { name: string }
  barber: { name: string }
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/reviews')
    setReviews(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function togglePublic(id: string, is_public: boolean) {
    await fetch('/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_public: !is_public }) })
    load()
  }

  return (
    <div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 24 }}>⭐ Отзывы</h1>
      {loading ? <p style={{ color: '#555' }}>Загрузка...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: '#1a1a1a', border: `1px solid ${r.is_public ? '#c8a96e44' : '#222'}`, borderRadius: 10, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ color: '#c8a96e', fontSize: 18, letterSpacing: 2 }}>{stars(r.rating)}</span>
                  <span style={{ color: '#888', fontSize: 13 }}>{r.client.name} → {r.barber.name}</span>
                  <span style={{ color: '#444', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                {r.comment && <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>{r.comment}</p>}
              </div>
              <button onClick={() => togglePublic(r.id, r.is_public)}
                style={{ background: r.is_public ? '#c8a96e22' : '#2a2a2a', border: `1px solid ${r.is_public ? '#c8a96e' : '#333'}`, borderRadius: 6, color: r.is_public ? '#c8a96e' : '#666', padding: '6px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {r.is_public ? '✅ Публичный' : '👁 Опубликовать'}
              </button>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: '#444', textAlign: 'center', padding: 40 }}>Отзывов пока нет</p>}
        </div>
      )}
    </div>
  )
}
