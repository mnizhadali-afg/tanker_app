import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerBalanceReport from './CustomerBalanceReport';
import ProducerBalanceReport from './ProducerBalanceReport';
import InvoiceStatusReport from './InvoiceStatusReport';
import TransactionHistoryReport from './TransactionHistoryReport';

const TABS = [
  'customerBalance',
  'producerBalance',
  'invoiceStatus',
  'transactionHistory',
] as const;

export default function ReportsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]>('customerBalance');

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold text-gray-900 dark:text-slate-100'>{t('reports.title')}</h1>

      <div className='flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 w-fit'>
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`hover:cursor-pointer text-sm px-4 py-1.5 rounded-md transition-colors ${tab === tb ? 'bg-white dark:bg-slate-800 shadow-sm font-medium text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
          >
            {t(`reports.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'customerBalance' && <CustomerBalanceReport />}
      {tab === 'producerBalance' && <ProducerBalanceReport />}
      {tab === 'invoiceStatus' && <InvoiceStatusReport />}
      {tab === 'transactionHistory' && <TransactionHistoryReport />}
    </div>
  );
}
