import { extractApiError } from '../../utils/formatting';
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'
import SearchableSelect from '../../components/shared/SearchableSelect'

interface Account { id: string; name: string }
interface Product { id: string; name: string }

const CALC_TYPES = ['cost_based', 'cost_based_usd', 'per_ton'] as const
interface CostEntry { key: string; value: string }

interface Props {
  formId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ContractFormPage({ formId, onSuccess, onCancel }: Props = {}) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const id = formId ?? params.id
  const isEdit = Boolean(id)
  const isModal = Boolean(onSuccess || onCancel)

  const [code, setCode] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [calculationType, setCalculationType] = useState<typeof CALC_TYPES[number]>('cost_based')
  const [defaultRatePerTonAfn, setDefaultRatePerTonAfn] = useState('')
  const [defaultRatePerTonUsd, setDefaultRatePerTonUsd] = useState('')
  const [defaultExchangeRate, setDefaultExchangeRate] = useState('')
  const [otherCosts, setOtherCosts] = useState<CostEntry[]>([])
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [customers, setCustomers] = useState<Account[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/accounts?type=customer&isActive=true').then((r) => setCustomers(r.data))
    api.get('/products?isActive=true').then((r) => setProducts(r.data))
    if (isEdit) {
      api.get(`/contracts/${id}`).then((r) => {
        const c = r.data
        setCode(c.code); setCustomerId(c.customerId); setProductId(c.productId)
        setCalculationType(c.calculationType)
        setDefaultRatePerTonAfn(c.defaultRatePerTonAfn ?? '')
        setDefaultRatePerTonUsd(c.defaultRatePerTonUsd ?? '')
        setDefaultExchangeRate(c.defaultExchangeRate ?? '')
        setNotes(c.notes ?? ''); setIsActive(c.isActive)
        if (c.otherDefaultCosts && typeof c.otherDefaultCosts === 'object') {
          setOtherCosts(Object.entries(c.otherDefaultCosts).map(([key, value]) => ({ key, value: String(value) })))
        }
      })
    }
  }, [id, isEdit])

  const addCostEntry = () => setOtherCosts((prev) => [...prev, { key: '', value: '' }])
  const removeCostEntry = (i: number) => setOtherCosts((prev) => prev.filter((_, idx) => idx !== i))
  const updateCostEntry = (i: number, field: 'key' | 'value', val: string) =>
    setOtherCosts((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))

  const done = () => onSuccess ? onSuccess() : navigate('/contracts')
  const cancel = () => onCancel ? onCancel() : navigate('/contracts')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const otherDefaultCosts = Object.fromEntries(
        otherCosts.filter((e) => e.key).map((e) => [e.key, Number(e.value) || 0])
      )
      const payload = {
        code, customerId, productId, calculationType,
        defaultRatePerTonAfn: defaultRatePerTonAfn ? Number(defaultRatePerTonAfn) : undefined,
        defaultRatePerTonUsd: defaultRatePerTonUsd ? Number(defaultRatePerTonUsd) : undefined,
        defaultExchangeRate: defaultExchangeRate ? Number(defaultExchangeRate) : undefined,
        otherDefaultCosts, notes,
      }
      if (isEdit) await api.patch(`/contracts/${id}`, { ...payload, isActive })
      else await api.post('/contracts', payload)
      done()
    } catch (err: unknown) {
      setError(t(extractApiError(err)))
    } finally { setSaving(false) }
  }

  const inputClass = 'w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100'
  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.code')}</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.calculationType')}</label>
          <select value={calculationType} onChange={(e) => setCalculationType(e.target.value as typeof CALC_TYPES[number])} className={inputClass}>
            {CALC_TYPES.map((ct) => <option key={ct} value={ct}>{t(`contracts.calculationTypes.${ct}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.customer')}</label>
          <SearchableSelect
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            value={customerId}
            onChange={setCustomerId}
            placeholder={`— ${t('contracts.customer')} —`}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.product')}</label>
          <SearchableSelect
            options={products.map((p) => ({ value: p.id, label: p.name }))}
            value={productId}
            onChange={setProductId}
            placeholder={`— ${t('contracts.product')} —`}
            required
          />
        </div>
      </div>

      {calculationType === 'per_ton' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.defaultRatePerTonAfn')}</label>
            <input type="number" value={defaultRatePerTonAfn} onChange={(e) => setDefaultRatePerTonAfn(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('contracts.defaultRatePerTonUsd')}</label>
            <input type="number" value={defaultRatePerTonUsd} onChange={(e) => setDefaultRatePerTonUsd(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('contracts.defaultExchangeRate')}</label>
        <input type="number" value={defaultExchangeRate} onChange={(e) => setDefaultExchangeRate(e.target.value)} className={inputClass} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">هزینه‌های پیش‌فرض دیگر</label>
          <button type="button" onClick={addCostEntry} className="text-xs text-primary-600 hover:underline cursor-pointer">+ افزودن</button>
        </div>
        {otherCosts.map((entry, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" placeholder="کلید" value={entry.key} onChange={(e) => updateCostEntry(i, 'key', e.target.value)} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
            <input type="number" placeholder="مقدار" value={entry.value} onChange={(e) => updateCostEntry(i, 'value', e.target.value)} className="w-32 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
            <button type="button" onClick={() => removeCostEntry(i)} className="text-red-500 hover:text-red-700 px-2 cursor-pointer">×</button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.notes')}</label>
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={cancel} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 cursor-pointer">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{isEdit ? t('app.edit') : t('contracts.new')}</h1>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">{formBody}</div>
    </div>
  )
}
