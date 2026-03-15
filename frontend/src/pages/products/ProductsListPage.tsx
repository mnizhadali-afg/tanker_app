import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import Modal from '../../components/shared/Modal'
import ProductFormPage from './ProductFormPage'
import api from '../../lib/axios'

interface Product { id: string; name: string; unit: string }

export default function ProductsListPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [modalId, setModalId] = useState<string | null | 'new'>(null)

  const fetchProducts = () => {
    api.get('/products').then((r) => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (product: Product) => {
    if (!confirm(t('app.confirm') + ': ' + product.name + '?')) return
    setDeleteError('')
    try {
      await api.delete(`/products/${product.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'))
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q)
  )

  const columns: Column<Product>[] = [
    { key: 'name', label: t('products.name') },
    { key: 'unit', label: t('products.unit') },
    {
      key: 'actions',
      label: t('app.actions'),
      render: (r) => (
        <div className="flex gap-2">
          <button className="text-xs text-primary-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); setModalId(r.id) }}>
            {t('app.edit')}
          </button>
          <button className="text-xs text-red-500 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(r) }}>
            {t('app.delete')}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('products.title')}</h1>
        <button onClick={() => setModalId('new')} className="bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer">
          + {t('products.new')}
        </button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{deleteError}</p>
      )}

      <div className="flex justify-end">
        <div className="relative w-72">
          <svg className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={t('app.noItems')}
        onRowClick={(r) => setModalId(r.id)}
      />

      {modalId !== null && (
        <Modal
          title={modalId === 'new' ? t('products.new') : t('app.edit')}
          onClose={() => setModalId(null)}
        >
          <ProductFormPage
            formId={modalId === 'new' ? undefined : modalId}
            onSuccess={() => { setModalId(null); fetchProducts() }}
            onCancel={() => setModalId(null)}
          />
        </Modal>
      )}
    </div>
  )
}
