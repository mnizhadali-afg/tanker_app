import { extractApiError } from '../../utils/formatting';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'
import SearchableSelect from '../../components/shared/SearchableSelect'

interface Account { id: string; name: string }
interface Product { id: string; name: string }

interface Props {
  formId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function LicenseFormPage({ formId, onSuccess, onCancel }: Props = {}) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const id = formId ?? params.id
  const isEdit = Boolean(id)
  const isModal = Boolean(onSuccess || onCancel)

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
    api.get('/products?isActive=true').then((r) => setProducts(r.data))
    api.get('/accounts?type=producer&isActive=true').then((r) => setProducers(r.data))
    if (isEdit) {
      api.get(`/licenses/${id}`).then((r) => {
        const l = r.data
        setLicenseNumber(l.licenseNumber); setProductId(l.productId); setProducerId(l.producerId)
        setValidFrom(l.validFrom?.slice(0, 10) ?? ''); setValidTo(l.validTo?.slice(0, 10) ?? '')
        setNotes(l.notes ?? ''); setIsActive(l.isActive)
      })
    }
  }, [id, isEdit])

  const done = () => onSuccess ? onSuccess() : navigate('/licenses')
  const cancel = () => onCancel ? onCancel() : navigate('/licenses')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { licenseNumber, productId, producerId, validFrom, validTo, notes }
      if (isEdit) await api.patch(`/licenses/${id}`, { ...payload, isActive })
      else await api.post('/licenses', payload)
      done()
    } catch (err: unknown) {
      setError(t(extractApiError(err)))
    } finally { setSaving(false) }
  }

  const inputClass = 'w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100'
  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('licenses.licenseNumber')}</label>
        <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('licenses.product')}</label>
        <SearchableSelect
          options={products.map((p) => ({ value: p.id, label: p.name }))}
          value={productId}
          onChange={setProductId}
          placeholder={`— ${t('licenses.product')} —`}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('licenses.producer')}</label>
        <SearchableSelect
          options={producers.map((p) => ({ value: p.id, label: p.name }))}
          value={producerId}
          onChange={setProducerId}
          placeholder={`— ${t('licenses.producer')} —`}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('licenses.validFrom')}</label>
          <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('licenses.validTo')}</label>
          <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('app.notes')}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
          {t('app.active')}
        </label>
      )}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={cancel} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">{t('app.cancel')}</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 cursor-pointer">{saving ? t('app.loading') : t('app.save')}</button>
      </div>
    </form>
  )

  if (isModal) return formBody

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={cancel} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 cursor-pointer">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{isEdit ? t('app.edit') : t('licenses.new')}</h1>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">{formBody}</div>
    </div>
  )
}
