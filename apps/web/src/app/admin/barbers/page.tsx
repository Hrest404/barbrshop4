'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

type Barber = { id: string; name: string; bio: string | null; photo_url: string | null; experience_years: number | null; is_active: boolean; sort_order: number }
type Form = { name: string; bio: string; photo_url: string; experience_years: string; is_active: boolean }

const emptyForm: Form = { name: '', bio: '', photo_url: '', experience_years: '', is_active: true }

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [editing, setEditing] = useState<Barber | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/barbers')
    setBarbers(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  function openEdit(b: Barber) {
    setEditing(b)
    setForm({ name: b.name, bio: b.bio ?? '', photo_url: b.photo_url ?? '', experience_years: String(b.experience_years ?? ''), is_active: b.is_active })
    setShowForm(true)
  }
  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true) }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'barbers')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm(f => ({ ...f, photo_url: data.url }))
    setUploading(false)
  }

  async function save() {
    const payload = { ...form, experience_years: form.experience_years ? Number(form.experience_years) : null }
    if (editing) {
      await fetch(`/api/admin/barbers/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/admin/barbers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowForm(false); load()
  }

  async function del(id: string) {
    if (!confirm('Удалить барбера?')) return
    await fetch(`/api/admin/barbers/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>✂️ Барберы</h1>
        <button onClick={openNew} style={{ background: '#c8a96e', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          + Добавить
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {barbers.map(b => (
          <div key={b.id} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 160, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {b.photo_url
                ? <img src={b.photo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ fontSize: 48, color: '#333' }}>✂️</div>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ color: b.is_active ? '#ddd' : '#555', fontWeight: 600, fontSize: 16 }}>{b.name}</div>
              {b.experience_years && <div style={{ color: '#666', fontSize: 13 }}>Опыт: {b.experience_years} лет</div>}
              {b.bio && <div style={{ color: '#666', fontSize: 13, marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.bio}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => openEdit(b)} style={{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: 6, color: '#aaa', padding: '6px', fontSize: 13, cursor: 'pointer' }}>✏️ Редактировать</button>
                <button onClick={() => del(b.id)} style={{ background: '#ff555511', border: '1px solid #ff5555', borderRadius: 6, color: '#ff5555', padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 32, width: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: 20 }}>{editing ? 'Редактировать' : 'Новый барбер'}</h3>

            {/* Фото */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#111', margin: '0 auto 10px', overflow: 'hidden', border: '2px solid #333' }}>
                {form.photo_url ? <img src={form.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 40, lineHeight: '100px', color: '#333' }}>✂️</div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ background: '#2a2a2a', border: '1px solid #333', borderRadius: 6, color: '#888', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                {uploading ? 'Загрузка...' : '📷 Загрузить фото'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ label: 'Имя', key: 'name' }, { label: 'Опыт (лет)', key: 'experience_years', type: 'number' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type={type ?? 'text'} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#ddd', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ color: '#777', fontSize: 12, display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                  style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, color: '#ddd', padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="ba" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="ba" style={{ color: '#888', fontSize: 14 }}>Активен</label>
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
