import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

import DashboardPage from '../../pages/dashboard/DashboardPage'

import AccountsListPage from '../../pages/accounts/AccountsListPage'

import ProductsListPage from '../../pages/products/ProductsListPage'
import ProductFormPage from '../../pages/products/ProductFormPage'

import PortsListPage from '../../pages/ports/PortsListPage'
import PortFormPage from '../../pages/ports/PortFormPage'

import LicensesListPage from '../../pages/licenses/LicensesListPage'
import LicenseFormPage from '../../pages/licenses/LicenseFormPage'

import ContractsListPage from '../../pages/contracts/ContractsListPage'
import ContractFormPage from '../../pages/contracts/ContractFormPage'

import InvoicesListPage from '../../pages/invoices/InvoicesListPage'
import InvoiceFormPage from '../../pages/invoices/InvoiceFormPage'
import InvoiceDetailPage from '../../pages/invoices/InvoiceDetailPage'

import PaymentsListPage from '../../pages/payments/PaymentsListPage'
import PaymentFormPage from '../../pages/payments/PaymentFormPage'

import ReportsPage from '../../pages/reports/ReportsPage'
import UsersPage from '../../pages/users/UsersPage'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-slate-900">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/accounts" element={<AccountsListPage />} />

            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />

            <Route path="/ports" element={<PortsListPage />} />
            <Route path="/ports/new" element={<PortFormPage />} />
            <Route path="/ports/:id/edit" element={<PortFormPage />} />

            <Route path="/licenses" element={<LicensesListPage />} />
            <Route path="/licenses/new" element={<LicenseFormPage />} />
            <Route path="/licenses/:id/edit" element={<LicenseFormPage />} />

            <Route path="/contracts" element={<ContractsListPage />} />
            <Route path="/contracts/new" element={<ContractFormPage />} />
            <Route path="/contracts/:id/edit" element={<ContractFormPage />} />

            <Route path="/invoices" element={<InvoicesListPage />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />

            <Route path="/payments" element={<PaymentsListPage />} />
            <Route path="/payments/new" element={<PaymentFormPage />} />

            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/*" element={<ReportsPage />} />

            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
