import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'
import SearchableSelect from '../../components/shared/SearchableSelect'

interface Account { id: string; name: string; type: string }
interface Contract { id: string; code: string; customerId: string }
interface Invoice { id: string; invoiceNumber: string; customerId: string }

interface PaymentData {
  id: string
  type: string
  linkedLevel: string
  payerAccountId?: string
  payeeAccountId?: string
  monetaryAccountId?: string
  customerId?: string
  contractId?: string
  invoiceId?: string
  amountAfn?: number
  amountUsd?: number
  exchangeRate?: number
  transactionDate: string
  notes?: string
}

interface Props {
  formId?: string
  initialData?: PaymentData
  onSuccess?: () => void
  onCancel?: () => void
}

const PAYMENT_TYPES = ['payment_in', 'payment_out', 'exchange'] as const
const LEVELS = ['customer', 'contract', 'invoice', 'account'] as const

export default function PaymentFormPage({ formId, initialData, onSuccess, onCancel }: Props = {}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const isEdit = Boolean(formId || initialData)
  const isModal = Boolean(onSuccess || onCancel)

  const [paymentType, setPaymentType] = useState<typeof PAYMENT_TYPES[number]>(
    (initialData?.type as typeof PAYMENT_TYPES[number]) ?? 'payment_in'
  )
  const [level, setLevel] = useState<typeof LEVELS[number]>(
    (initialData?.linkedLevel as typeof LEVELS[number]) ??
    (searchParams.get('customerId') ? 'customer' : 'account')
  )
  const [payerAccountId, setPayerAccountId] = useState(initialData?.payerAccountId ?? '')
  const [payeeAccountId, setPayeeAccountId] = useState(initialData?.payeeAccountId ?? '')
  const [monetaryAccountId, setMonetaryAccountId] = useState(initialData?.monetaryAccountId ?? '')
  const [showMonetaryAccount, setShowMonetaryAccount] = useState(Boolean(initialData?.monetaryAccountId))
  const [customerId, setCustomerId] = useState(
    initialData?.customerId ?? searchParams.get('customerId') ?? ''
  )
  const [contractId, setContractId] = useState(
    initialData?.contractId ?? searchParams.get('contractId') ?? ''
  )
  const [invoiceId, setInvoiceId] = useState(
    initialData?.invoiceId ?? searchParams.get('invoiceId') ?? ''
  )
  const [amountAfn, setAmountAfn] = useState(initialData?.amountAfn?.toString() ?? '')
  const [amountUsd, setAmountUsd] = useState(initialData?.amountUsd?.toString() ?? '')
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchangeRate?.toString() ?? '')
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate
      ? initialData.transactionDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  const [accounts, setAccounts] = useState<Account[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/accounts?isActive=true').then((r) => setAccounts(r.data))
  }, [])

  useEffect(() => {
    if ((level === 'contract' || level === 'invoice') && customerId) {
      api.get(`/contracts?customerId=${customerId}&isActive=true`).then((r) => setContracts(r.data))
    }
  }, [level, customerId])

  useEffect(() => {
    if (level === 'invoice' && contractId) {
      api.get(`/invoices?contractId=${contractId}`).then((r) => setInvoices(r.data))
    }
  }, [level, contractId])

  const customers = accounts.filter((a) => a.type === 'customer')
  const monetaryAccounts = accounts.filter((a) => a.type === 'monetary')
  const isAccountLevel = level === 'account'

  const done = () => onSuccess ? onSuccess() : navigate(-1)
  const cancel = () => onCancel ? onCancel() : navigate(-1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const payload = {
      type: paymentType,
      payerAccountId: payerAccountId || undefined,
      payeeAccountId: payeeAccountId || undefined,
      monetaryAccountId: showMonetaryAccount ? (monetaryAccountId || undefined) : undefined,
      linkedLevel: level,
      customerId: isAccountLevel ? undefined : (customerId || undefined),
      contractId: contractId || undefined,
      invoiceId: invoiceId || undefined,
      amountAfn: amountAfn ? Number(amountAfn) : undefined,
      amountUsd: amountUsd ? Number(amountUsd) : undefined,
      exchangeRate: exchangeRate ? Number(exchangeRate) : undefined,
      transactionDate,
      notes,
    }
    try {
      if (isEdit) {
        await api.patch(`/payments/monetary/${formId ?? initialData?.id}`, payload)
      } else {
        await api.post('/payments/monetary', payload)
      }
      done()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('errors.serverError'))
    } finally { setSaving(false) }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.type')}</label>
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as typeof PAYMENT_TYPES[number])} className={inputClass}>
            {PAYMENT_TYPES.map((pt) => <option key={pt} value={pt}>{t(`payments.types.${pt}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.level')}</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as typeof LEVELS[number])} className={inputClass}>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`payments.levels.${l}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.payer')}</label>
          <SearchableSelect
            options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${t(`accounts.types.${a.type}`)})` }))}
            value={payerAccountId}
            onChange={setPayerAccountId}
            placeholder={`— ${t('payments.payer')} —`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.payee')}</label>
          <SearchableSelect
            options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${t(`accounts.types.${a.type}`)})` }))}
            value={payeeAccountId}
            onChange={setPayeeAccountId}
            placeholder={`— ${t('payments.payee')} —`}
          />
        </div>
      </div>

      {!isAccountLevel && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('accounts.types.customer')}</label>
          <SearchableSelect
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
            value={customerId}
            onChange={(v) => { setCustomerId(v); setContractId(''); setInvoiceId('') }}
            placeholder={`— ${t('accounts.types.customer')} —`}
            required
          />
        </div>
      )}

      {(level === 'contract' || level === 'invoice') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.contract')}</label>
          <SearchableSelect
            options={contracts.map((c) => ({ value: c.id, label: c.code }))}
            value={contractId}
            onChange={(v) => { setContractId(v); setInvoiceId('') }}
            placeholder={`— ${t('invoices.contract')} —`}
          />
        </div>
      )}

      {level === 'invoice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.title')}</label>
          <SearchableSelect
            options={invoices.map((inv) => ({ value: inv.id, label: inv.invoiceNumber }))}
            value={invoiceId}
            onChange={setInvoiceId}
            placeholder={`— ${t('invoices.title')} —`}
          />
        </div>
      )}

      {/* Optional monetary account */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={showMonetaryAccount}
            onChange={(e) => {
              setShowMonetaryAccount(e.target.checked)
              if (!e.target.checked) setMonetaryAccountId('')
            }}
            className="rounded border-gray-300"
          />
          {t('payments.specifyMonetaryAccount')}
        </label>
        {showMonetaryAccount && (
          <SearchableSelect
            options={monetaryAccounts.map((a) => ({ value: a.id, label: a.name }))}
            value={monetaryAccountId}
            onChange={setMonetaryAccountId}
            placeholder={`— ${t('payments.monetaryAccount')} —`}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.amountAfn')}</label>
          <input type="number" value={amountAfn} onChange={(e) => setAmountAfn(e.target.value)} className={inputClass} step="any" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.amountUsd')}</label>
          <input type="number" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} className={inputClass} step="any" min="0" />
        </div>
      </div>

      {paymentType === 'exchange' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.exchangeRate')}</label>
          <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className={inputClass} step="any" min="0" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.transactionDate')}</label>
        <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.notes')}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={cancel} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer">{t('app.cancel')}</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 cursor-pointer">
          {saving ? t('app.loading') : t('app.save')}
        </button>
      </div>
    </form>
  )

  if (isModal) return formBody

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={cancel} className="text-sm text-gray-500 hover:text-gray-700">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? t('app.edit') : t('payments.new')}</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">{formBody}</div>
    </div>
  )
}
