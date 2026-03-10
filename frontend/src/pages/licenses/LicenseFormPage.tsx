import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'

interface Account { id: string; name: string }
interface Product { id: string; name: string }

export default function LicenseFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isEdit = Boolean(id)

  const [licenseNumber, setLicenseNumber] = useState('')
  const [productId, setProductId] = useState('')
  const [producerId, setProducerId] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [producers, setProducers] = useState<Account[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data))
    api.get('/accounts?type=producer').then((r) => setProducers(r.data))
    if (isEdit) {
      api.get(`/licenses/${id}`).then((r) => {
        const l = r.data
        setLicenseNumber(l.licenseNumber); setProductId(l.productId); setProducerId(l.producerId)
        setValidFrom(l.validFrom?.slice(0, 10) ?? ''); setValidTo(l.validTo?.slice(0, 10) ?? '')
        setNotes(l.notes ?? ''); setIsActive(l.isActive)
      })
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { licenseNumber, productId, producerId, validFrom, validTo, notes }
      if (isEdit) await api.patch(`/licenses/${id}`, { ...payload, isActive })
      else await api.post('/licenses', payload)
      navigate('/licenses')
    } catch { setError(t('errors.serverError')) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/licenses')} className="text-sm text-gray-500 hover:text-gray-700">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? t('app.edit') : t('licenses.new')}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('licenses.licenseNumber')}</label>
          <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('licenses.product')}</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">— {t('licenses.product')} —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('licenses.producer')}</label>
          <select value={producerId} onChange={(e) => setProducerId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">— {t('licenses.producer')} —</option>
            {producers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('licenses.validFrom')}</label>
            <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('licenses.validTo')}</label>
            <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
            {t('app.active')}
          </label>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/licenses')} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('app.cancel')}</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? t('app.loading') : t('app.save')}</button>
        </div>
      </form>
    </div>
  )
}
