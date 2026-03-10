import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  key: string
  path: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { key: 'dashboard', path: '/dashboard' },
  { key: 'accounts', path: '/accounts' },
  { key: 'products', path: '/products' },
  { key: 'ports', path: '/ports' },
  { key: 'licenses', path: '/licenses' },
  { key: 'contracts', path: '/contracts' },
  { key: 'invoices', path: '/invoices' },
  { key: 'payments', path: '/payments' },
  { key: 'reports', path: '/reports' },
  { key: 'users', path: '/users', roles: ['admin'] },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const visible = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  )

  return (
    <aside className="w-56 shrink-0 bg-white border-e border-gray-200 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
        <span className="text-primary-700 font-bold text-sm text-center leading-tight">
          {t('app.title')}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {visible.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium border-s-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
