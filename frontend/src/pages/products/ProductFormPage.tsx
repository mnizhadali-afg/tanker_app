import { extractApiError } from '../../utils/formatting';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'

interface Props {
  formId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductFormPage({ formId, onSuccess, onCancel }: Props = {}) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const id = formId ?? params.id
  const isEdit = Boolean(id)
  const isModal = Boolean(onSuccess || onCancel)

  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.get(`/products/${id}`).then((r) => {
      setName(r.data.name); setUnit(r.data.unit); setNotes(r.data.notes ?? ''); setIsActive(r.data.isActive)
    })
  }, [id, isEdit])

  const done = () => onSuccess ? onSuccess() : navigate('/products')
  const cancel = () => onCancel ? onCancel() : navigate('/products')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      if (isEdit) await api.patch(`/products/${id}`, { name, unit, notes, isActive })
      else await api.post('/products', { name, unit, notes })
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
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('products.name')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('products.unit')}</label>
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('app.notes')}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{isEdit ? t('app.edit') : t('products.new')}</h1>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">{formBody}</div>
    </div>
  )
}
