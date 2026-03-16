import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable, { type Column } from '../../components/shared/DataTable'
import Modal from '../../components/shared/Modal'
import DetailModal from '../../components/shared/DetailModal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import ProductFormPage from './ProductFormPage'
import api from '../../lib/axios'

interface Product { id: string; name: string; unit: string }

export default function ProductsListPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [detailRow, setDetailRow] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [modalId, setModalId] = useState<string | null | 'new'>(null)

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const fetchProducts = () => {
    api.get('/products').then((r) => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/products/${pendingDelete.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'))
      setPendingDelete(null)
    } finally { setDeleting(false) }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    setDeleteError('')
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/products/${id}`)))
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
      setShowBulkDelete(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(typeof msg === 'string' ? msg : t('errors.serverError'))
      setShowBulkDelete(false)
    } finally { setBulkDeleting(false) }
  }

  const q = search.trim().toLowerCase()
  const filtered = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q)
  )

  const selectedNames = products.filter((p) => selectedIds.has(p.id)).map((p) => p.name)

  const columns: Column<Product>[] = [
    { key: 'name', label: t('products.name') },
    { key: 'unit', label: t('products.unit') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('products.title')}</h1>
        <button onClick={() => setModalId('new')} className="bg-success-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer">
          + {t('products.new')}
        </button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">{deleteError}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {selectedIds.size}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
            >
              × {t('app.clearSelection')}
            </button>
          </div>
        ) : <div />}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkDelete(true)}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg cursor-pointer font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('app.delete')}
            </button>
          )}
          <div className="relative w-72">
            <svg className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('app.search')}…`} className="w-full ps-9 pe-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={t('app.noItems')}
        onRowClick={(r) => { setSelectedIds(new Set()); setDetailRow(r); }}
        totalCount={products.length}
        label={t('nav.products')}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {detailRow && (
        <DetailModal
          title={detailRow.name}
          fields={[
            { label: t('products.name'), value: detailRow.name },
            { label: t('products.unit'), value: detailRow.unit },
          ]}
          onClose={() => setDetailRow(null)}
          actions={
            <>
              <button
                onClick={() => { setDetailRow(null); setPendingDelete(detailRow) }}
                className="px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                {t('app.delete')}
              </button>
              <button
                onClick={() => { setDetailRow(null); setModalId(detailRow.id) }}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer"
              >
                {t('app.edit')}
              </button>
            </>
          }
        />
      )}

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

      {showBulkDelete && (
        <ConfirmDialog
          title={t('app.deleteSelected')}
          message={t('app.bulkDeleteConfirmMsg')}
          items={selectedNames}
          confirmLabel={t('app.delete')}
          loading={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
        />
      )}

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
