import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface Account {
  id: string
  name: string
  type: string
  phone?: string
  isActive: boolean
}

export default function AccountsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const params = typeFilter ? `?type=${typeFilter}` : ''
    api.get(`/accounts${params}`)
      .then((r) => setAccounts(r.data))
      .finally(() => setLoading(false))
  }, [typeFilter])

  const columns: Column<Account>[] = [
    { key: 'name', label: t('accounts.name') },
    {
      key: 'type',
      label: t('accounts.type'),
      render: (row) => t(`accounts.types.${row.type}`),
    },
    { key: 'phone', label: t('accounts.phone') },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'active' : 'inactive'}
          label={t(row.isActive ? 'app.active' : 'app.inactive')}
        />
      ),
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (row) => (
        <button
          className="text-xs text-primary-600 hover:underline"
          onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${row.id}/edit`) }}
        >
          {t('app.edit')}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('accounts.title')}</h1>
        <button
          onClick={() => navigate('/accounts/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + {t('accounts.new')}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {['', 'customer', 'producer', 'monetary', 'other'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              typeFilter === type
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {type ? t(`accounts.types.${type}`) : t('app.all')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={accounts}
        loading={loading}
        onRowClick={(row) => navigate(`/accounts/${row.id}`)}
        emptyMessage={t('app.search')}
      />
    </div>
  )
}
