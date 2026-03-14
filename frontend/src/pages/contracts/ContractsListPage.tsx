import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../lib/axios';

interface Contract {
  id: string;
  code: string;
  customer: { name: string };
  product: { name: string };
  calculationType: string;
  isActive: boolean;
}

export default function ContractsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>(
    '',
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/contracts')
      .then((r) => setContracts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = contracts.filter((c) => {
    const matchesActive =
      activeFilter === '' ||
      (activeFilter === 'active' && c.isActive) ||
      (activeFilter === 'inactive' && !c.isActive);
    const matchesSearch =
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.customer.name.toLowerCase().includes(q) ||
      c.product.name.toLowerCase().includes(q);
    return matchesActive && matchesSearch;
  });

  const columns: Column<Contract>[] = [
    { key: 'code', label: t('contracts.code') },
    {
      key: 'customer',
      label: t('contracts.customer'),
      render: (r) => r.customer.name,
    },
    {
      key: 'product',
      label: t('contracts.product'),
      render: (r) => r.product.name,
    },
    {
      key: 'calculationType',
      label: t('contracts.calculationType'),
      render: (r) => t(`contracts.calculationTypes.${r.calculationType}`),
    },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (r) => (
        <StatusBadge
          status={r.isActive ? 'active' : 'inactive'}
          label={t(r.isActive ? 'app.active' : 'app.inactive')}
        />
      ),
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <button
          className='text-xs text-primary-600 hover:underline'
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/contracts/${r.id}/edit`);
          }}
        >
          {t('app.edit')}
        </button>
      ),
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>
          {t('contracts.title')}
        </h1>
        <button
          onClick={() => navigate('/contracts/new')}
          className='bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('contracts.new')}
        </button>
      </div>

      {/* Active filter tags + search toolbar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2'>
          {(['', 'active', 'inactive'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveFilter(v)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeFilter === v
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {v === ''
                ? t('app.all')
                : v === 'active'
                  ? t('app.active')
                  : t('app.inactive')}
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
        onRowClick={(r) => navigate(`/contracts/${r.id}/edit`)}
      />
    </div>
  );
}
