import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CustomerBalanceReport from './CustomerBalanceReport'
import InvoiceStatusReport from './InvoiceStatusReport'
import TransactionHistoryReport from './TransactionHistoryReport'

const TABS = ['customerBalance', 'invoiceStatus', 'transactionHistory'] as const

export default function ReportsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<typeof TABS[number]>('customerBalance')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t('reports.title')}</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${tab === tb ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t(`reports.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'customerBalance' && <CustomerBalanceReport />}
      {tab === 'invoiceStatus' && <InvoiceStatusReport />}
      {tab === 'transactionHistory' && <TransactionHistoryReport />}
    </div>
  )
}
