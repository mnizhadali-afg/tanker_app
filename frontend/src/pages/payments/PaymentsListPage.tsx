import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import { formatDate, formatNumber } from '../../utils/formatting';
import api from '../../lib/axios';

interface Payment {
  id: string;
  type: string;
  linkedLevel: string;
  payer?: { name: string };
  payee?: { name: string };
  contract?: { code: string };
  invoice?: { invoiceNumber: string };
  amountAfn?: number;
  amountUsd?: number;
  transactionDate: string;
  notes?: string;
}

export default function PaymentsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/payments')
      .then((r) => setPayments(r.data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = payments.filter((p) => {
    const matchesType = !typeFilter || p.type === typeFilter;
    const matchesSearch =
      !q ||
      (p.payer?.name ?? '').toLowerCase().includes(q) ||
      (p.payee?.name ?? '').toLowerCase().includes(q) ||
      (p.contract?.code ?? '').toLowerCase().includes(q) ||
      (p.invoice?.invoiceNumber ?? '').toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const columns: Column<Payment>[] = [
    {
      key: 'type',
      label: t('payments.type'),
      render: (r) => t(`payments.types.${r.type}`),
    },
    {
      key: 'linkedLevel',
      label: t('payments.level'),
      render: (r) => t(`payments.levels.${r.linkedLevel}`),
    },
    {
      key: 'payer',
      label: t('payments.payer'),
      render: (r) => r.payer?.name ?? '—',
    },
    {
      key: 'payee',
      label: t('payments.payee'),
      render: (r) => r.payee?.name ?? '—',
    },
    {
      key: 'contract',
      label: t('contracts.code'),
      render: (r) => r.contract?.code ?? '—',
    },
    {
      key: 'invoice',
      label: t('invoices.invoiceNumber'),
      render: (r) => r.invoice?.invoiceNumber ?? '—',
    },
    {
      key: 'amountAfn',
      label: t('payments.amountAfn'),
      render: (r) => (r.amountAfn ? formatNumber(r.amountAfn, locale) : '—'),
    },
    {
      key: 'amountUsd',
      label: t('payments.amountUsd'),
      render: (r) => (r.amountUsd ? formatNumber(r.amountUsd, locale) : '—'),
    },
    {
      key: 'transactionDate',
      label: t('payments.transactionDate'),
      render: (r) => formatDate(r.transactionDate, locale),
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>
          {t('payments.title')}
        </h1>
        <button
          onClick={() => navigate('/payments/new')}
          className='bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('payments.new')}
        </button>
      </div>

      {/* Type filter tags + search toolbar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2 flex-wrap'>
          {(['', 'payment_in', 'payment_out', 'exchange'] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  typeFilter === type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type ? t(`payments.types.${type}`) : t('app.all')}
              </button>
            ),
          )}
        </div>
        <div className='relative w-72'>
          <svg
            className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z'
            />
          </svg>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('app.search')}…`}
            className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white'
          />
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} />
    </div>
  );
}
