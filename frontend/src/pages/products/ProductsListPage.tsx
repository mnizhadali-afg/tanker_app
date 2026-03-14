import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import api from '../../lib/axios'

interface Product { id: string; name: string; unit: string; isActive: boolean }

export default function ProductsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = () => {
    api.get('/products').then((r) => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDeactivate = async (product: Product) => {
    if (!confirm(t('app.confirm') + ': ' + product.name + '?')) return
    await api.delete(`/products/${product.id}`)
    fetchProducts()
  }

  const columns: Column<Product>[] = [
    { key: 'name', label: t('products.name') },
    { key: 'unit', label: t('products.unit') },
    {
      key: 'isActive',
      label: t('app.status'),
      render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} label={t(r.isActive ? 'app.active' : 'app.inactive')} />,
    },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <div className="flex gap-2">
          <button
            className="text-xs text-primary-600 hover:underline"
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${r.id}/edit`) }}
          >
            {t('app.edit')}
          </button>
          {r.isActive && (
            <button
              className="text-xs text-red-500 hover:underline"
              onClick={(e) => { e.stopPropagation(); handleDeactivate(r) }}
            >
              {t('app.delete')}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('products.title')}</h1>
        <button onClick={() => navigate('/products/new')} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + {t('products.new')}
        </button>
      </div>
      <DataTable columns={columns} rows={products} loading={loading} />
    </div>
  )
}
