import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../lib/axios';

interface User {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
}

const ROLES = ['admin', 'accountant', 'data_entry', 'viewer'] as const;

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('data_entry');
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    api
      .get('/users')
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadUsers();
  }, []);

  const openNew = () => {
    setEditUser(null);
    setUsername('');
    setPassword('');
    setRole('data_entry');
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setUsername(u.username);
    setPassword('');
    setRole(u.role as (typeof ROLES)[number]);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        const payload: Record<string, unknown> = { role };
        if (password) payload.password = password;
        await api.patch(`/users/${editUser.id}`, payload);
      } else {
        await api.post('/users', { username, password, role });
      }
      setShowForm(false);
      loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
    loadUsers();
  };

  const q = search.trim().toLowerCase();
  const filtered = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesSearch = !q || u.username.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const columns: Column<User>[] = [
    { key: 'username', label: t('users.username') },
    {
      key: 'role',
      label: t('users.role'),
      render: (r) => t(`users.roles.${r.role}`),
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
        <div className='flex gap-3'>
          <button
            className='text-xs text-primary-600 hover:underline'
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
          >
            {t('app.edit')}
          </button>
          <button
            className='text-xs text-gray-500 hover:underline'
            onClick={(e) => {
              e.stopPropagation();
              toggleActive(r);
            }}
          >
            {r.isActive ? t('app.inactive') : t('app.active')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>{t('users.title')}</h1>
        <button
          onClick={openNew}
          className='bg-green-600 hover:bg-green-700 hover:cursor-pointer text-white text-sm font-medium px-4 py-2 rounded-lg'
        >
          + {t('users.new')}
        </button>
      </div>

      {/* Role filter tags + search toolbar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex gap-2 flex-wrap'>
          {(['', ...ROLES] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                roleFilter === r
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {r ? t(`users.roles.${r}`) : t('app.all')}
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

      <DataTable columns={columns} rows={filtered} loading={loading} />

      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4'>
            <h2 className='text-lg font-bold text-gray-900 mb-4'>
              {editUser ? t('app.edit') : t('users.new')}
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {!editUser && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('users.username')}
                  </label>
                  <input
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                  />
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {editUser ? t('users.newPassword') : t('auth.password')}
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editUser}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('users.role')}
                </label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as (typeof ROLES)[number])
                  }
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`users.roles.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex gap-3 justify-end pt-2'>
                <button
                  type='button'
                  onClick={() => setShowForm(false)}
                  className='px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                >
                  {t('app.cancel')}
                </button>
                <button
                  type='submit'
                  disabled={saving}
                  className='px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50'
                >
                  {saving ? t('app.loading') : t('app.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
