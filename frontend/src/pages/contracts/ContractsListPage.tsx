import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import api from '../../lib/axios';

interface Contract {
  id: string;
  code: string;
  customer: { name: string };
  product: { name: string };
  calculationType: string;
}

export default function ContractsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    api.get('/contracts').then((r) => setContracts(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (contract: Contract) => {
    if (!confirm(t('app.confirm') + ': ' + contract.code + '?')) return;
    setDeleteError('');
    try {
      await api.delete(`/contracts/${contract.id}`);
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = contracts.filter(
    (c) => !q || c.code.toLowerCase().includes(q) || c.customer.name.toLowerCase().includes(q) || c.product.name.toLowerCase().includes(q),
  );

  const columns: Column<Contract>[] = [
    { key: 'code', label: t('contracts.code') },
    { key: 'customer', label: t('contracts.customer'), render: (r) => r.customer.name },
    { key: 'product', label: t('contracts.product'), render: (r) => r.product.name },
    { key: 'calculationType', label: t('contracts.calculationType'), render: (r) => t(`contracts.calculationTypes.${r.calculationType}`) },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <div className='flex gap-2'>
          <button
            className='text-xs text-primary-600 hover:underline'
            onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${r.id}/edit`); }}
          >
            {t('app.edit')}
          </button>
          <button
            className='text-xs text-red-500 hover:underline'
            onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
          >
            {t('app.delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>{t('contracts.title')}</h1>
        <button
          onClick={() => navigate('/contracts/new')}
          className='bg-success-600 hover:bg-green-700 hover:cursor-pointer text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('contracts.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      <div className='flex justify-end'>
        <div className='relative w-72'>
          <svg className='absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z' />
          </svg>
          <input type='text' value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className='w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white' />
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} onRowClick={(r) => navigate(`/contracts/${r.id}/edit`)} />
    </div>
  );
}
