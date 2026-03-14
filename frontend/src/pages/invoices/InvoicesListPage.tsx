import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate, formatNumber } from '../../utils/formatting';
import api from '../../lib/axios';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  contract: { code: string; calculationType: string };
  status: string;
  issueDate: string;
  _count: { tankers: number };
}

export default function InvoicesListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [canceling, setCanceling] = useState(false);

  const fetchInvoices = () => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api
      .get(`/invoices${params}`)
      .then((r) => setInvoices(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      await api.patch(`/invoices/${cancelTarget.id}/cancel`);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === cancelTarget.id ? { ...inv, status: 'canceled' } : inv,
        ),
      );
      setCancelTarget(null);
    } finally {
      setCanceling(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = invoices.filter(
    (inv) =>
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.name.toLowerCase().includes(q) ||
      inv.contract.code.toLowerCase().includes(q),
  );

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', label: t('invoices.invoiceNumber') },
    {
      key: 'customer',
      label: t('invoices.customer'),
      render: (r) => r.customer.name,
    },
    {
      key: 'contract',
      label: t('invoices.contract'),
      render: (r) => r.contract.code,
    },
    {
      key: 'calculationType',
      label: t('contracts.calculationType'),
      render: (r) =>
        t(`contracts.calculationTypes.${r.contract.calculationType}`),
    },
    {
      key: 'issueDate',
      label: t('invoices.issueDate'),
      render: (r) => formatDate(r.issueDate, locale),
    },
    {
      key: 'status',
      label: t('invoices.status'),
      render: (r) => (
        <StatusBadge
          status={r.status}
          label={t(`invoices.statuses.${r.status}`)}
        />
      ),
    },
    {
      key: 'tankers',
      label: t('tankers.title'),
      render: (r) => formatNumber(r._count.tankers, locale, 0),
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/invoices/${r.id}`)}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-50"
          >
            {t('app.edit')}
          </button>
          {r.status === 'draft' && (
            <button
              onClick={() => setCancelTarget(r)}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
            >
              {t('invoices.cancel')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>
          {t('invoices.title')}
        </h1>
        <button
          onClick={() => navigate('/invoices/new')}
          className='bg-success-600 hover:bg-green-700 hover:cursor-pointer text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('invoices.new')}
        </button>
      </div>

      {/* Status filter tags + search toolbar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2 flex-wrap'>
          {['', 'draft', 'final', 'canceled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s ? t(`invoices.statuses.${s}`) : t('app.all')}
            </button>
          ))}
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

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              {t('invoices.cancel')}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('invoices.cancelConfirm')}
              {' '}
              <span className="font-medium">{cancelTarget.invoiceNumber}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={canceling}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {canceling ? t('app.loading') : t('invoices.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
