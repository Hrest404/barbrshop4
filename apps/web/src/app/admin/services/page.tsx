'use client'
import { useEffect, useState, useCallback } from 'react'

type Service = { id: string; name: string; description: string | null; duration_min: number; price: string; is_active: boolean; sort_order: number }
type Form = { name: string; description: string; duration_min: string; price: string; is_active: boolean; sort_order: string }

const emptyForm: Form = { name: '', description: '', duration_min: '30', price: '0', is_active: true, sort_order: '0' }

const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#ddd', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', ...props.style }} />
)

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/services')
    setServices(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(s: Service) {
    setEditing(s)
    setForm({ name: s.name, description: s.description ?? '', duration_min: String(s.duration_min), price: String(s.price), is_active: s.is_active, sort_order: String(s.sort_order) })
    setShowForm(true)
  }

  async function save() {
    const payload = { ...form, duration_min: Number(form.duration_min), sort_order: Number(form.sort_order), price: form.price }
    if (editing) {
      await fetch(`/api/admin/services/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/admin/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowForm(false); load()
  }

  async function del(id: string) {
    if (!confirm('Удалить услугу?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>💈 Услуги</h1>
        <button onClick={openNew} style={{ background: '#c8a96e', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          + Добавить
        </button>
      </div>

      {loading ? <p style={{ color: '#555' }}>Загрузка...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(s => (
            <div key={s.id} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.is_active ? '#ddd' : '#555', fontWeight: 600, fontSize: 15 }}>{s.name} {!s.is_active && <span style={{ color: '#444', fontSize: 12 }}>(скрыта)</span>}</div>
                {s.description && <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{s.description}</div>}
              </div>
              <div style={{ color: '#888', fontSize: 14 }}>{s.duration_min} мин</div>
              <div style={{ color: '#c8a96e', fontWeight: 600, fontSize: 16, minWidth: 80, textAlign: 'right' }}>{Number(s.price).toLocaleString('ru')} ₸</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(s)} style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 6, color: '#aaa', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                <button onClick={() => del(s.id)} style={{ background: '#ff555511', border: '1px solid #ff5555', borderRadius: 6, color: '#ff5555', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: 20 }}>{editing ? 'Редактировать услугу' : 'Новая услуга'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>Название</label>
                {input({ value: form.name, onChange: e => setForm(f => ({ ...f, name: e.target.value })) })}
              </div>
              <div><label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>Описание</label>
                {input({ value: form.description, onChange: e => setForm(f => ({ ...f, description: e.target.value })) })}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>Длительность (мин)</label>
                  {input({ type: 'number', value: form.duration_min, onChange: e => setForm(f => ({ ...f, duration_min: e.target.value })) })}
                </div>
                <div style={{ flex: 1 }}><label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>Цена (₸)</label>
                  {input({ type: 'number', value: form.price, onChange: e => setForm(f => ({ ...f, price: e.target.value })) })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" style={{ color: '#888', fontSize: 14 }}>Активна</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, color: '#888', padding: '10px', cursor: 'pointer' }}>Отмена</button>
              <button onClick={save} style={{ flex: 2, background: '#c8a96e', border: 'none', borderRadius: 8, color: '#000', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
