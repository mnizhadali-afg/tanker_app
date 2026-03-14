import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../lib/axios'

interface Contract {
  id: string
  code: string
  customer: { id: string; name: string }
}

export default function InvoiceFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractId, setContractId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/contracts?isActive=true').then((r) => setContracts(r.data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractId) { setError(t('errors.required')); return }
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/invoices', { contractId, issueDate, notes })
      navigate(`/invoices/${data.id}`)
    } catch {
      setError(t('errors.serverError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('app.back')}
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('invoices.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.contract')}</label>
          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— {t('invoices.contract')} —</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} ({c.customer.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoices.issueDate')}</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t('app.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? t('app.loading') : t('app.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
