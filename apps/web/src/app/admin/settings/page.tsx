'use client'
import { useEffect, useState } from 'react'

const SETTING_KEYS: { key: string; label: string; description: string; type?: string }[] = [
  { key: 'shop_name', label: 'Название барбершопа', description: 'Отображается на сайте' },
  { key: 'shop_address', label: 'Адрес', description: '' },
  { key: 'shop_phone', label: 'Телефон', description: '' },
  { key: 'booking_horizon_days', label: 'Горизонт бронирования (дней)', description: 'Как далеко вперёд можно записаться', type: 'number' },
  { key: 'min_notice_min', label: 'Мин. заблаговременность (мин)', description: 'За сколько минут до записи нельзя бронировать', type: 'number' },
  { key: 'cancel_cutoff_min', label: 'Отмена не позднее (мин до)', description: 'За сколько минут можно отменить', type: 'number' },
  { key: 'slot_step_min', label: 'Шаг слотов (мин)', description: 'Например: 15 или 30', type: 'number' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => { setSettings(d); setLoading(false) })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <p style={{ color: '#555' }}>Загрузка...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>⚙️ Настройки</h1>
        <button onClick={save} disabled={saving}
          style={{ background: saved ? '#4ade80' : '#c8a96e', color: '#000', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'background 0.3s' }}>
          {saved ? '✅ Сохранено' : saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SETTING_KEYS.map(({ key, label, description, type }) => (
          <div key={key} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#ddd', fontWeight: 500, fontSize: 15 }}>{label}</div>
              {description && <div style={{ color: '#555', fontSize: 13, marginTop: 2 }}>{description}</div>}
            </div>
            <input
              type={type ?? 'text'}
              value={settings[key] ?? ''}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
              style={{ background: '#111', border: '1px solid #333', borderRadius: 8, color: '#ddd', padding: '10px 14px', fontSize: 14, width: 200 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
