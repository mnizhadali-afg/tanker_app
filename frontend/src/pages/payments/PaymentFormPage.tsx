import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'

interface Account { id: string; name: string; type: string }
interface Contract { id: string; code: string; customerId: string }
interface Invoice { id: string; invoiceNumber: string; customerId: string }

const PAYMENT_TYPES = ['payment_in', 'payment_out', 'exchange'] as const
const LEVELS = ['customer', 'contract', 'invoice', 'account'] as const

export default function PaymentFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const [paymentType, setPaymentType] = useState<typeof PAYMENT_TYPES[number]>('payment_in')
  const [level, setLevel] = useState<typeof LEVELS[number]>(
    searchParams.get('customerId') ? 'customer' : 'account'
  )
  const [payerAccountId, setPayerAccountId] = useState('')
  const [payeeAccountId, setPayeeAccountId] = useState('')
  const [monetaryAccountId, setMonetaryAccountId] = useState('')
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') ?? '')
  const [contractId, setContractId] = useState(searchParams.get('contractId') ?? '')
  const [invoiceId, setInvoiceId] = useState(searchParams.get('invoiceId') ?? '')
  const [amountAfn, setAmountAfn] = useState('')
  const [amountUsd, setAmountUsd] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/payments/monetary', {
        type: paymentType,
        payerAccountId: payerAccountId || undefined,
        payeeAccountId: payeeAccountId || undefined,
        monetaryAccountId: monetaryAccountId || undefined,
        linkedLevel: level,
        customerId: isAccountLevel ? undefined : (customerId || undefined),
        contractId: contractId || undefined,
        invoiceId: invoiceId || undefined,
        amountAfn: amountAfn ? Number(amountAfn) : undefined,
        amountUsd: amountUsd ? Number(amountUsd) : undefined,
        exchangeRate: exchangeRate ? Number(exchangeRate) : undefined,
        transactionDate,
        notes,
      })
      navigate(-1)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || t('errors.serverError'))
    } finally { setSaving(false) }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← {t('app.back')}</button>
        <h1 className="text-xl font-bold text-gray-900">{t('payments.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
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

        {/* Payer / Payee — shown for all levels */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.payer')}</label>
            <select value={payerAccountId} onChange={(e) => setPayerAccountId(e.target.value)} className={inputClass}>
              <option value="">— {t('payments.payer')} —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({t(`accounts.types.${a.type}`)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.payee')}</label>
            <select value={payeeAccountId} onChange={(e) => setPayeeAccountId(e.target.value)} className={inputClass}>
              <option value="">— {t('payments.payee')} —</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({t(`accounts.types.${a.type}`)})</option>)}
            </select>
          </div>
        </div>

        {/* Customer linking — not shown for account-level */}
        {!isAccountLevel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('accounts.types.customer')}</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setContractId(''); setInvoiceId('') }} required className={inputClass}>
              <option value="">— {t('accounts.types.customer')} —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {(level === 'contract' || level === 'invoice') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.contract')}</label>
            <select value={contractId} onChange={(e) => { setContractId(e.target.value); setInvoiceId('') }} className={inputClass}>
              <option value="">— {t('invoices.contract')} —</option>
              {contracts.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </div>
        )}

        {level === 'invoice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.title')}</label>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className={inputClass}>
              <option value="">— {t('invoices.title')} —</option>
              {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('payments.monetaryAccount')}</label>
          <select value={monetaryAccountId} onChange={(e) => setMonetaryAccountId(e.target.value)} className={inputClass}>
            <option value="">— {t('payments.monetaryAccount')} —</option>
            {monetaryAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
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
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t('app.cancel')}</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {saving ? t('app.loading') : t('app.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
