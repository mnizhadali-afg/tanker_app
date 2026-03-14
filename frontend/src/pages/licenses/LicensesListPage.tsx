import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate } from '../../utils/formatting';
import api from '../../lib/axios';

interface License {
  id: string;
  licenseNumber: string;
  product: { name: string };
  producer: { name: string };
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export default function LicensesListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language;
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>(
    '',
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/licenses')
      .then((r) => setLicenses(r.data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = licenses.filter((l) => {
    const matchesActive =
      activeFilter === '' ||
      (activeFilter === 'active' && l.isActive) ||
      (activeFilter === 'inactive' && !l.isActive);
    const matchesSearch =
      !q ||
      l.licenseNumber.toLowerCase().includes(q) ||
      l.product.name.toLowerCase().includes(q) ||
      l.producer.name.toLowerCase().includes(q);
    return matchesActive && matchesSearch;
  });

  const columns: Column<License>[] = [
    { key: 'licenseNumber', label: t('licenses.licenseNumber') },
    {
      key: 'product',
      label: t('licenses.product'),
      render: (r) => r.product.name,
    },
    {
      key: 'producer',
      label: t('licenses.producer'),
      render: (r) => r.producer.name,
    },
    {
      key: 'validFrom',
      label: t('licenses.validFrom'),
      render: (r) => formatDate(r.validFrom, locale),
    },
    {
      key: 'validTo',
      label: t('licenses.validTo'),
      render: (r) => formatDate(r.validTo, locale),
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
            navigate(`/licenses/${r.id}/edit`);
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
          {t('licenses.title')}
        </h1>
        <button
          onClick={() => navigate('/licenses/new')}
          className='bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('licenses.new')}
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
        onRowClick={(r) => navigate(`/licenses/${r.id}/edit`)}
      />
    </div>
  );
}
