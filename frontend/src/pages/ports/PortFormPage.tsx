import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'

interface Account { id: string; name: string }

export default function PortFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [producerId, setProducerId] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [producers, setProducers] = useState<Account[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/accounts?type=producer').then((r) => setProducers(r.data))
    if (isEdit) {
      api.get(`/ports/${id}`).then((r) => {
        setName(r.data.name); setProducerId(r.data.producerId); setNotes(r.data.notes ?? ''); setIsActive(r.data.isActive)
      })
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producerId) { setError(t('errors.required')); return }
    setSaving(true); setError('')
    try {
      if (isEdit) await api.patch(`/ports/${id}`, { name, producerId, notes, isActive })
      else await api.post('/ports', { name, producerId, notes })
      navigate('/ports')
    } catch { setError(t('errors.serverError')) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/ports')} className="text-sm text-gray-500 hover:text-gray-700">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? t('app.edit') : t('ports.new')}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('ports.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('ports.producer')}</label>
          <select value={producerId} onChange={(e) => setProducerId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">— {t('ports.producer')} —</option>
            {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
            {t('app.active')}
          </label>
        )}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/ports')} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('app.cancel')}</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? t('app.loading') : t('app.save')}</button>
        </div>
      </form>
    </div>
  )
}
