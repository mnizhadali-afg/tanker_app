import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import AccountDrawer from './AccountDrawer';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import AccountFormPage from './AccountFormPage';
import api from '../../lib/axios';

interface Account {
  id: string;
  name: string;
  type: string;
  phone?: string;
}

export default function AccountsListPage() {
  const { t } = useTranslation();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalId, setModalId] = useState<string | null | 'new'>(null);

  const fetchAccounts = () => {
    const params = typeFilter ? `?type=${typeFilter}` : '';
    api
      .get(`/accounts${params}`)
      .then((r) => setAccounts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, [typeFilter]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/accounts/${pendingDelete.id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'));
      setPendingDelete(null);
    } finally { setDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filtered = accounts.filter(
    (a) =>
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.phone ?? '').toLowerCase().includes(q),
  );

  const columns: Column<Account>[] = [
    { key: 'name', label: t('accounts.name') },
    {
      key: 'type',
      label: t('accounts.type'),
      render: (row) => t(`accounts.types.${row.type}`),
    },
    { key: 'phone', label: t('accounts.phone') },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (row) => (
        <div className='flex gap-2'>
          <button
            className='text-xs text-primary-600 hover:underline cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              setModalId(row.id);
            }}
          >
            {t('app.edit')}
          </button>
          <button
            className='text-xs text-red-500 hover:underline'
            onClick={(e) => {
              e.stopPropagation();
              setPendingDelete(row);
            }}
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
        <h1 className='text-xl font-bold text-gray-900'>
          {t('accounts.title')}
        </h1>
        <button
          onClick={() => setModalId('new')}
          className='bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer'
        >
          + {t('accounts.new')}
        </button>
      </div>

      {deleteError && (
        <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2'>
          {deleteError}
        </p>
      )}

      {/* Type filter tags + search toolbar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2 flex-wrap'>
          {['', 'customer', 'producer', 'monetary', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                typeFilter === type
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type ? t(`accounts.types.${type}`) : t('app.all')}
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
        onRowClick={(row) => setSelectedId(row.id)}
        emptyMessage={t('app.noItems')}
        totalCount={accounts.length}
        label={t('nav.accounts')}
      />

      {pendingDelete && (
        <ConfirmDialog
          title={t('app.delete')}
          message={t('app.deleteConfirmMsg')}
          itemName={pendingDelete.name}
          confirmLabel={t('app.delete')}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <AccountDrawer
        accountId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(id) => { setSelectedId(null); setModalId(id); }}
      />

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('accounts.new') : t('app.edit')}
          onClose={() => setModalId(null)}
        >
          <AccountFormPage
            formId={modalId === 'new' ? undefined : modalId}
            onSuccess={() => { setModalId(null); fetchAccounts(); }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  );
}
